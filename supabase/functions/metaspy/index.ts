import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 处理 CORS 预检请求
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { keyword, maxResults = 50, adLibraryUrl: inputAdLibraryUrl } = await req.json()

        // 从环境变量中获取 Token 和 Actor ID
        // 部署后通过 `supabase secrets set` 设置
        const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN')
        const ACTOR_ID = Deno.env.get('APIFY_ACTOR_ID')

        if (!APIFY_TOKEN || !ACTOR_ID) {
            throw new Error('Missing APIFY_API_TOKEN or APIFY_ACTOR_ID secret')
        }

        // 构建 Ad Library URL
        // 优先使用前端传来的 adLibraryUrl，否则用 keyword 拼接
        let adLibraryUrl: string
        if (inputAdLibraryUrl) {
            // 直接使用用户输入的完整 URL
            adLibraryUrl = inputAdLibraryUrl
        } else if (keyword) {
            // 旧的关键词模式，自动拼接 URL
            const baseUrl = "https://www.facebook.com/ads/library/"
            const params = new URLSearchParams({
                active_status: "active",
                ad_type: "all",
                country: "ALL",
                is_targeted_country: "false",
                media_type: "all",
                q: keyword,
                search_type: "keyword_unordered"
            })
            adLibraryUrl = `${baseUrl}?${params.toString()}&sort_data[mode]=total_impressions&sort_data[direction]=desc`
        } else {
            throw new Error('Must provide either adLibraryUrl or keyword')
        }

        // 1. 启动 Apify 任务
        const runResponse = await fetch(`https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adLibraryUrl, maxResults }),
        })

        if (!runResponse.ok) {
            const errorText = await runResponse.text()
            throw new Error(`Apify error: ${errorText}`)
        }

        const runData = await runResponse.json()
        const runId = runData.data.id
        const datasetId = runData.data.defaultDatasetId

        // 2. 等待结果 (短轮询示例)
        // 注意：Edge Function 有执行时间限制，如果抓取 400 条，建议走异步
        // 这里我们先实现“触发”并返回结果 ID，或者尝试等待一小会儿
        let attempts = 0
        let items = []
        while (attempts < 5) { // 最多在边缘端等待 50 秒
            await new Promise(resolve => setTimeout(resolve, 10000))

            const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
            const statusData = await statusRes.json()

            if (statusData.data.status === 'SUCCEEDED') {
                const resultRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`)
                items = await resultRes.json()
                break
            } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData.data.status)) {
                throw new Error(`Apify run ${statusData.data.status}`)
            }
            attempts++
        }

        return new Response(JSON.stringify({ items, runId, status: items.length > 0 ? 'SUCCESS' : 'PENDING' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

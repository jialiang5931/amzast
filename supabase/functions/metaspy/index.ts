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
        const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN')?.trim()
        let ACTOR_ID = Deno.env.get('APIFY_ACTOR_ID')?.trim()

        if (!APIFY_TOKEN || !ACTOR_ID) {
            throw new Error('Missing APIFY_API_TOKEN or APIFY_ACTOR_ID secret')
        }

        // 调试日志：打印清理后的变量（部分隐藏）
        console.log(`Using Actor ID: ${ACTOR_ID}`);
        console.log(`Using Token: ${APIFY_TOKEN.substring(0, 5)}...`);

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

        // 构建送给 Apify 的 payload
        // 根据官方 API 文档，adLibraryUrl 应该是一个字符串
        const apifyPayload = {
            adLibraryUrl: adLibraryUrl,
            maxResults: maxResults
        }

        const apifyUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`;

        console.log(`Sending payload to Apify: ${JSON.stringify(apifyPayload)}`);
        console.log(`URL: ${apifyUrl}`);

        // 1. 启动 Apify 任务
        const runResponse = await fetch(apifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apifyPayload),
        })

        if (!runResponse.ok) {
            const errorText = await runResponse.text()
            throw new Error(`Apify error (Status: ${runResponse.status}): ${errorText}`)
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

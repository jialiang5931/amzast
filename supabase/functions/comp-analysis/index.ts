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
        const { urls, actorId } = await req.json()

        const APIFY_TOKEN = Deno.env.get('APIFY_API_TOKEN')?.trim()

        if (!APIFY_TOKEN) {
            throw new Error('Missing APIFY_API_TOKEN secret')
        }

        if (!urls || !Array.isArray(urls)) {
            throw new Error('Must provide a "urls" array')
        }

        const ACTOR_ID = (actorId || 'axesso_data/amazon-product-details-scraper').replace('/', '~')
        const apifyPayload = { urls }

        console.log(`[Comp Analysis] Actor: ${ACTOR_ID}, URLs: ${urls.length}`)

        const apifyUrl = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs?token=${APIFY_TOKEN}`

        // 1. 启动 Apify 任务
        const runResponse = await fetch(apifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apifyPayload),
        })

        if (!runResponse.ok) {
            const errorText = await runResponse.text()
            throw new Error(`Apify run error (${runResponse.status}): ${errorText}`)
        }

        const runData = await runResponse.json()
        const runId = runData.data.id
        const datasetId = runData.data.defaultDatasetId

        // 2. 轮询等待结果
        let attempts = 0
        let items = []
        while (attempts < 10) {  // 最多等 100 秒
            await new Promise(resolve => setTimeout(resolve, 10000))

            const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`)
            const statusData = await statusRes.json()

            console.log(`[Comp Analysis] Run status attempt ${attempts + 1}: ${statusData.data.status}`)

            if (statusData.data.status === 'SUCCEEDED') {
                const resultRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`)
                items = await resultRes.json()
                break
            } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(statusData.data.status)) {
                throw new Error(`Apify run ${statusData.data.status}`)
            }
            attempts++
        }

        return new Response(JSON.stringify({
            items,
            runId,
            status: items.length > 0 ? 'SUCCESS' : 'PENDING'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error('[comp-analysis] Caught error:', msg)
        return new Response(JSON.stringify({ error: msg, items: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})

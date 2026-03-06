import { supabase } from './supabase';

export const scrapeMetaAds = async (
    arg1: string | { keyword?: string; country?: string; maxResults?: number; adLibraryUrl?: string },
    arg2?: string,
    arg3?: number
) => {
    let keyword: string | undefined;
    let maxResults: number = 400;
    let adLibraryUrl: string | undefined;

    if (typeof arg1 === 'object' && arg1 !== null) {
        // 新的对象传参方式
        keyword = arg1.keyword;
        maxResults = arg1.maxResults || 400;
        adLibraryUrl = arg1.adLibraryUrl;
    } else {
        // 旧的字符串传参方式: (keyword, country, maxResults)
        keyword = arg1 as string;
        maxResults = arg3 || 400;
    }

    try {
        // 构建干净的 payload，剔除 undefined 字段
        const payload: any = { maxResults };
        if (keyword) payload.keyword = keyword;
        if (adLibraryUrl) payload.adLibraryUrl = adLibraryUrl;

        // 兼容旧接口的 country 参数
        const country = (typeof arg1 === 'object' && arg1 !== null) ? arg1.country : arg2;
        if (country) payload.country = country;

        // 【调试日志】打印前端打包注入的环境变量
        console.log('[apify.ts] Vite Env Vars at Runtime:');
        console.log('ACTOR_ID:', import.meta.env.VITE_APIFY_ACTOR_ID);
        console.log('TOKEN starts with:', import.meta.env.VITE_APIFY_API_TOKEN?.substring(0, 5));

        const { data, error } = await supabase.functions.invoke('metaspy', {
            body: payload
        });

        // 打印原始响应，方便调试
        console.log('[apify.ts] Edge Function response:', { data, error });

        if (error) {
            // 尝试从 data 中取出真实的后端错误信息
            const backendMsg = data?.error || error.message;
            console.error('[apify.ts] Edge Function error:', backendMsg, '| raw error:', error);
            throw new Error(`Edge Function returned an error: ${backendMsg}`);
        }

        if (data?.error) {
            throw new Error(data.error);
        }

        // 如果状态是 SUCCESS，直接返回 items
        if (data.status === 'SUCCESS') {
            return data.items || [];
        }

        // 如果状态是 PENDING（可能任务太长），我们需要后续的轮询逻辑
        // 但目前先实现基础的返回
        return data.items || [];
    } catch (error) {
        console.error('Apify Proxy error:', error);
        throw error;
    }
};

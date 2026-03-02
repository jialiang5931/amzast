import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase 环境变量缺失！请在 Zeabur 仪表板中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。');
}

// 使用一个占位符或仅在有 URL 时创建客户端，防止 createClient 抛出错误
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

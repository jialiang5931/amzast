export interface RawAmazonRow {
    // Basic Info
    ASIN: string;
    '父ASIN'?: string;
    '商品标题'?: string;
    '品牌': string;
    '卖家属地'?: string;

    // Metrics
    '价格': number;
    '近30天销量': number;
    '父体月销量'?: number;
    '评分': number;
    '评分数': number;
    '留评率'?: number | string;

    // Dates
    '上架时间': string | number;
    '上架时段'?: string;

    // Links
    '商品详情页链接': string;

    // Dynamic keys for monthly sales (e.g., "2025-12", "2025-12($)")
    [key: string]: any;
}

export interface ScatterDataPoint {
    price: number;
    units: number;
    brand: string;
    launchDate: string | number;
    url: string;
    asin: string;
    title?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    coupon?: string | number;
}

export interface MonthlyTrendPoint {
    month: number; // 1-12
    units: number | null;
}

export interface YearlyTrendData {
    year: string;
    data: MonthlyTrendPoint[];
}

export interface BrandSharePoint {
    brand: string;
    units: number;
    percentage: number;
}

export interface ParsedData {
    rows: RawAmazonRow[];
    totalRows: number;
    scatterData: ScatterDataPoint[];
    monthlyData: YearlyTrendData[];
    brandData: BrandSharePoint[];
}

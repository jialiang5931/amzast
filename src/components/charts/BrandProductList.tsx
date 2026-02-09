import React from 'react';
import { ArrowLeft, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import type { RawAmazonRow } from '../../lib/types';

interface BrandProductListProps {
    brand: string;
    products: RawAmazonRow[];
    onBack: () => void;
}

export const BrandProductList: React.FC<BrandProductListProps> = ({ brand, products, onBack }) => {
    // Sort by "近30天销量" descending
    const sortedProducts = [...products].sort((a, b) => {
        const salesA = Number(a['近30天销量']) || 0;
        const salesB = Number(b['近30天销量']) || 0;
        return salesB - salesA;
    });

    return (
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all active:scale-95 group border border-slate-200"
                        title="返回图表"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">品牌详情</span>
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{brand}</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">共有 {products.length} 款相关商品，按近30天销量排序</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-600">
                            总销量: {products.reduce((acc, curr) => acc + (Number(curr['近30天销量']) || 0), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">产品信息</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-center">ASIN</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">价格</th>
                            <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">评分数</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 text-right">近30天销量</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedProducts.map((product) => (
                            <tr key={product.ASIN} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {product['首图链接'] ? (
                                                <img
                                                    src={product['首图链接']}
                                                    alt={product['商品标题']}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ShoppingBag className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="max-w-md">
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-relaxed">
                                                {product['商品标题'] || '无标题'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <code className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600 border border-slate-200">
                                        {product.ASIN}
                                    </code>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700 font-mono">
                                        ${Number(product['价格']).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-bold text-slate-600">{product['评分数']?.toLocaleString() || 0}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 text-blue-600">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-base font-black font-mono">
                                            {Number(product['近30天销量']).toLocaleString()}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                <div className="p-20 text-center">
                    <p className="text-slate-400">该品牌下未找到商品数据</p>
                </div>
            )}
        </div>
    );
};

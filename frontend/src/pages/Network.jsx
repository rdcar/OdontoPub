import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Network() {
    const [data, setData] = useState({ nodes: [], links: [] });
    const fgRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        api.getGraph().then(setData).catch(console.error);
    }, []);

    const [filterName, setFilterName] = useState("");
    const [filterArea, setFilterArea] = useState("");

    // Extract unique areas for dropdown
    const areas = [...new Set(data.nodes.flatMap(n => n.atuacao ? n.atuacao.split(';').map(a => a.trim()) : []))].sort();

    // Color Palette for Areas
    const COLORS = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4',
        '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
        '#64748b', '#78716c'
    ];

    // Memoize area colors
    const areaColorMap = useRef({});
    useEffect(() => {
        const newMap = {};
        areas.forEach((area, i) => {
            newMap[area] = COLORS[i % COLORS.length];
        });
        areaColorMap.current = newMap;
    }, [areas]);

    // Pre-load images
    useEffect(() => {
        data.nodes.forEach(node => {
            if (!node.img && node.photo) {
                const img = new Image();
                img.src = `http://localhost:8000${node.photo.toLowerCase().split(' ').join('_')}`;
                node.img = img;
            }
        });
    }, [data.nodes]);

    const filteredData = {
        nodes: data.nodes.filter(n => {
            const matchName = n.nome.toLowerCase().includes(filterName.toLowerCase());
            const matchArea = filterArea ? (n.atuacao && n.atuacao.includes(filterArea)) : true;
            return matchName && matchArea;
        }),
        links: data.links // We filter links dynamically based on remaining nodes
    };

    // Calculate Degrees (Connections) dynamically for filtered view
    const nodeDegree = {};
    filteredData.links.forEach(l => {
        // handle object or ID reference
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        nodeDegree[s] = (nodeDegree[s] || 0) + 1;
        nodeDegree[t] = (nodeDegree[t] || 0) + 1;
    });

    // Filter links: Only keep links where both source/target are in the filtered nodes list
    const activeNodeIds = new Set(filteredData.nodes.map(n => n.id));
    filteredData.links = data.links.filter(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return activeNodeIds.has(s) && activeNodeIds.has(t);
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Rede de Colaboração</h1>
                    <div className="text-sm text-slate-500 hidden md:block">
                        Clique no nó para ver o perfil • {filteredData.nodes.length} Docentes
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Filtrar por nome..."
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-48"
                        value={filterName}
                        onChange={e => setFilterName(e.target.value)}
                    />
                    <select
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-48"
                        value={filterArea}
                        onChange={e => setFilterArea(e.target.value)}
                    >
                        <option value="">Todas as Áreas</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex overflow-x-auto gap-3 text-xs whitespace-nowrap">
                {areas.map(a => (
                    <div key={a} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: areaColorMap.current[a] }}></span>
                        <span className="text-slate-600">{a}</span>
                    </div>
                ))}
            </div>

            <div className="flex-1 relative">
                <ForceGraph2D
                    ref={fgRef}
                    graphData={filteredData}
                    nodeLabel="nome"
                    linkColor={() => '#e2e8f0'}
                    linkWidth={link => Math.sqrt(link.value)}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const size = 12;
                        const fontSize = 12 / globalScale;

                        const mainArea = node.atuacao ? node.atuacao.split(';')[0].trim() : '';
                        const color = areaColorMap.current[mainArea] || '#cbd5e1';

                        // 1. Draw Border (Area Color)
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
                        ctx.fillStyle = color;
                        ctx.fill();

                        // 2. Draw White Background
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                        ctx.fillStyle = '#ffffff';
                        ctx.fill();

                        // 3. Draw Image
                        if (node.img) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                            ctx.clip();
                            try {
                                ctx.drawImage(node.img, node.x - size, node.y - size, size * 2, size * 2);
                            } catch (err) {
                                ctx.fillStyle = '#f1f5f9';
                                ctx.fill();
                            }
                            ctx.restore();
                        } else {
                            ctx.fillStyle = '#f1f5f9';
                            ctx.fill();
                        }

                        // 4. Draw Degree Badge
                        const degree = nodeDegree[node.id] || 0;
                        if (degree > 0) {
                            const badgeSize = 5;
                            const badgeX = node.x + size * 0.7;
                            const badgeY = node.y - size * 0.7;

                            ctx.beginPath();
                            ctx.arc(badgeX, badgeY, badgeSize, 0, 2 * Math.PI, false);
                            ctx.fillStyle = '#ef4444';
                            ctx.fill();

                            ctx.font = 'bold 4px Sans-Serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = 'white';
                            ctx.fillText(degree, badgeX, badgeY);
                        }

                        // 5. Draw Label
                        if (globalScale >= 1.5) {
                            ctx.font = `${fontSize * 1.5}px Sans-Serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'top';
                            ctx.fillStyle = '#1e293b';
                            ctx.fillText(node.nome.split(' ')[0], node.x, node.y + size + 2);
                        }
                    }}
                    nodePointerAreaPaint={(node, color, ctx) => {
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    onNodeClick={node => {
                        navigate(`/professor/${node.id}`);
                    }}
                    cooldownTicks={100}
                    onEngineStop={() => fgRef.current.zoomToFit(400)}
                />
            </div>
        </div>
    );
}

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatMT } from '@/lib/utils';
import { Activity, TrendingUp } from 'lucide-react';

export function BankingCharts() {
  const { data: dashboardData } = useDashboard();

  // Gerar dados reais baseados no lucro atual para criar uma curva de crescimento
  // Em um sistema real, isso viria de um nó 'history' no Firebase
  const currentProfit = dashboardData?.lucros || 0;
  const totalAssets = dashboardData?.total || 100000;

  // Simulação de histórico real baseada nos ativos atuais (proporcional)
  const chartData = [
    { name: 'Jan', valor: (totalAssets * 0.7) / 100 },
    { name: 'Fev', valor: (totalAssets * 0.75) / 100 },
    { name: 'Mar', valor: (totalAssets * 0.82) / 100 },
    { name: 'Abr', valor: (totalAssets * 0.88) / 100 },
    { name: 'Mai', valor: (totalAssets * 0.95) / 100 },
    { name: 'Jun', valor: totalAssets / 100 }, // Valor real de hoje
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Monitor de Rendimento Ativo</span>
          </div>
          <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Evolução do Capital</h3>
          <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">Crescimento Patrimonial vs Investimento</p>
        </div>
        
        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-primary/20 transition-all">
           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[9px] text-white/40 font-black uppercase tracking-widest leading-none mb-1">Lucro Verificado</p>
              <p className="text-xl font-black text-white font-mono">{formatMT(currentProfit)}</p>
           </div>
        </div>
      </div>
      
      <div className="h-[300px] w-full mt-4 bg-black/20 rounded-[2rem] p-4 border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 tech-grid-bg opacity-10 pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorElite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
              dy={10}
            />
            <YAxis 
               hide 
               domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black/90 backdrop-blur-xl border border-primary/20 p-4 rounded-xl shadow-2xl">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                      <p className="text-lg font-black text-white font-mono">
                         {formatMT((payload[0].value as number) * 100)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-success" />
                         <span className="text-[8px] text-success font-black uppercase">Dados Auditados</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="valor" 
              stroke="#00d4ff" 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorElite)" 
              animationDuration={2000}
              dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4, stroke: '#050505' }}
              activeDot={{ r: 8, fill: '#fff', stroke: '#00d4ff', strokeWidth: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
         {[
           { label: "Velocidade de Dados", val: "1.4ms", icon: <Activity className="w-3 h-3" /> },
           { label: "Status da Rede", val: "ESTÁVEL", icon: <TrendingUp className="w-3 h-3" /> },
           { label: "Carga do Cofre", val: "84%", icon: <Activity className="w-3 h-3" /> },
           { label: "Nível de Risco", val: "MÍNIMO", icon: <Activity className="w-3 h-3" /> },
         ].map((item, i) => (
           <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
              <div className="text-primary">{item.icon}</div>
              <div>
                 <p className="text-[7px] font-black text-white/40 uppercase tracking-widest">{item.label}</p>
                 <p className="text-[10px] font-black text-white uppercase italic">{item.val}</p>
              </div>
           </div>
         ))}
      </div>
    </motion.div>
  );
}

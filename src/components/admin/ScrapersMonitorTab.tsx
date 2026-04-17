import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, RefreshCw, CheckCircle2, AlertCircle, Clock, StopCircle, Zap } from "lucide-react";

interface ScraperRow {
  id: string;
  url: string;
  method: "rss" | "firecrawl";
  is_active: boolean;
  interval_minutes: number;
  last_run_at: string | null;
  last_error: string | null;
  source: { name: string } | null;
  category: { name: string } | null;
}

const ScrapersMonitorTab = () => {
  const [rows, setRows] = useState<ScraperRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAll, setRunningAll] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [batchStats, setBatchStats] = useState<{ batches: number; inserted: number }>({ batches: 0, inserted: 0 });
  const continuousRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("scraper_configs")
      .select(
        "id,url,method,is_active,interval_minutes,last_run_at,last_error,source:sources(name),category:categories(name)"
      )
      .order("last_run_at", { ascending: false, nullsFirst: false });
    setRows((data as ScraperRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const runAll = async () => {
    setRunningAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-scrapers", { body: {} });
      if (error) throw error;
      toast.success(`চালু হলো — ${data?.processed ?? 0}টি কনফিগ, ${data?.inserted ?? 0}টি নতুন পোস্ট`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ত্রুটি");
    } finally {
      setRunningAll(false);
    }
  };

  const stopContinuous = () => {
    continuousRef.current = false;
    setContinuousMode(false);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    toast.info("কন্টিনিউয়াস মোড বন্ধ");
  };

  const runContinuous = async () => {
    if (continuousRef.current) return stopContinuous();
    continuousRef.current = true;
    setContinuousMode(true);
    setBatchStats({ batches: 0, inserted: 0 });
    toast.success("কন্টিনিউয়াস ব্যাচ শুরু — queue=0 না হওয়া পর্যন্ত চলবে");

    const tick = async () => {
      if (!continuousRef.current) return;
      try {
        const { data, error } = await supabase.functions.invoke("run-scrapers", { body: {} });
        if (error) throw error;
        const processed = Number(data?.processed ?? 0);
        const inserted = Number(data?.inserted ?? 0);
        setBatchStats((s) => ({ batches: s.batches + 1, inserted: s.inserted + inserted }));
        await load();
        if (processed === 0) {
          toast.success(`✓ Queue শেষ — মোট ${inserted} নতুন পোস্ট`);
          stopContinuous();
          return;
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "ব্যাচ ত্রুটি");
      }
      if (continuousRef.current) {
        timerRef.current = window.setTimeout(tick, 30000);
      }
    };
    tick();
  };

  useEffect(() => () => {
    continuousRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const runOne = async (id: string) => {
    setRunningId(id);
    try {
      // Force this scraper to be due by clearing last_run_at, then run.
      await supabase.from("scraper_configs").update({ last_run_at: null }).eq("id", id);
      const { data, error } = await supabase.functions.invoke("run-scrapers", { body: {} });
      if (error) throw error;
      toast.success(`চালু — ${data?.inserted ?? 0}টি নতুন পোস্ট`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ত্রুটি");
    } finally {
      setRunningId(null);
    }
  };

  const total = rows.length;
  const active = rows.filter((r) => r.is_active).length;
  const failing = rows.filter((r) => r.last_error).length;
  const ranRecently = rows.filter(
    (r) => r.last_run_at && Date.now() - new Date(r.last_run_at).getTime() < 60 * 60 * 1000
  ).length;
  const successRate = total > 0 ? Math.round(((total - failing) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="bg-card border border-border p-4">
          <div className="text-xs text-muted-foreground">মোট স্ক্রেপার</div>
          <div className="text-2xl font-headline text-headline">{total}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs text-muted-foreground">সক্রিয়</div>
          <div className="text-2xl font-headline text-headline">{active}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs text-muted-foreground">শেষ ১ ঘণ্টায় চালু</div>
          <div className="text-2xl font-headline text-headline">{ranRecently}</div>
        </div>
        <div className="bg-card border border-border p-4">
          <div className="text-xs text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-headline text-headline">{successRate}%</div>
        </div>
      </section>

      <section className="bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-headline text-lg text-headline">স্ক্রেপার মনিটরিং</h2>
            {continuousMode && (
              <p className="text-xs text-primary mt-1">
                <Zap className="h-3 w-3 inline mr-1" />
                কন্টিনিউয়াস চলছে — ব্যাচ {batchStats.batches}, নতুন পোস্ট {batchStats.inserted}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={load} variant="outline" size="sm" disabled={continuousMode}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> রিফ্রেশ
            </Button>
            <Button onClick={runAll} disabled={runningAll || continuousMode} size="sm" variant="outline">
              {runningAll ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-1" />
              )}
              একবার চালান
            </Button>
            <Button onClick={runContinuous} size="sm" variant={continuousMode ? "destructive" : "default"}>
              {continuousMode ? (
                <><StopCircle className="h-3.5 w-3.5 mr-1" /> থামান</>
              ) : (
                <><Zap className="h-3.5 w-3.5 mr-1" /> সব চালান (কন্টিনিউয়াস)</>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">কোনো স্ক্রেপার নেই।</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2">স্ট্যাটাস</th>
                  <th className="py-2 pr-2">সোর্স / ক্যাটাগরি</th>
                  <th className="py-2 pr-2">পদ্ধতি</th>
                  <th className="py-2 pr-2">সর্বশেষ চালু</th>
                  <th className="py-2 pr-2">ত্রুটি</th>
                  <th className="py-2 pr-2 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const ok = !r.last_error && r.last_run_at;
                  return (
                    <tr key={r.id} className="border-b border-border/50">
                      <td className="py-2 pr-2">
                        {!r.is_active ? (
                          <Badge variant="outline" className="text-xs">
                            নিষ্ক্রিয়
                          </Badge>
                        ) : ok ? (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> চলছে
                          </Badge>
                        ) : r.last_error ? (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" /> ত্রুটি
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" /> অপেক্ষা
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <div className="font-medium">{r.source?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.category?.name ?? "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[260px]">
                          {r.url}
                        </div>
                      </td>
                      <td className="py-2 pr-2 uppercase text-xs">{r.method}</td>
                      <td className="py-2 pr-2 text-xs">
                        {r.last_run_at
                          ? new Date(r.last_run_at).toLocaleString("bn-BD", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "কখনো চালু হয়নি"}
                        <div className="text-[10px] text-muted-foreground">
                          প্রতি {r.interval_minutes} মিনিট
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-xs text-destructive max-w-[200px] truncate">
                        {r.last_error ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runOne(r.id)}
                          disabled={runningId === r.id || runningAll}
                        >
                          {runningId === r.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ScrapersMonitorTab;

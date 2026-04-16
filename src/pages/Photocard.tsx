import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

const Photocard = () => {
  const [url, setUrl] = useState("");
  const [size, setSize] = useState<"square" | "portrait" | "landscape">("square");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ image: string; quote: string } | null>(null);

  const generate = async () => {
    if (!url) {
      toast.error("URL দিন");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-photocard", {
        body: { url, size },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ image: data.image, quote: data.quote });
      toast.success("ফটোকার্ড তৈরি হয়েছে");
    } catch (e: any) {
      toast.error(e.message || "ত্রুটি ঘটেছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container-news py-8">
        <h1 className="font-headline text-2xl sm:text-3xl text-headline mb-6">
          AI ফটোকার্ড জেনারেটর
        </h1>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-5 space-y-4">
            <div>
              <Label>সংবাদ URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>কার্ড সাইজ</Label>
              <Select value={size} onValueChange={(v: any) => setSize(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">স্কয়ার (1:1)</SelectItem>
                  <SelectItem value="portrait">পোর্ট্রেট (3:4)</SelectItem>
                  <SelectItem value="landscape">ল্যান্ডস্কেপ (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> জেনারেট হচ্ছে...
                </>
              ) : (
                "ফটোকার্ড বানান"
              )}
            </Button>
          </div>

          <div className="bg-card border border-border p-5 min-h-[300px] flex items-center justify-center">
            {result ? (
              <div className="space-y-3 w-full">
                <img
                  src={result.image}
                  alt="photocard"
                  className="w-full max-w-md mx-auto"
                />
                <blockquote className="italic text-center text-muted-foreground">
                  &ldquo;{result.quote}&rdquo;
                </blockquote>
                <a
                  href={result.image}
                  download="photocard.png"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 mx-auto"
                >
                  <Download className="h-4 w-4" /> ডাউনলোড
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                URL দিন — AI সংবাদ থেকে কোটেশন বের করে ফটোকার্ড বানিয়ে দেবে।
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Photocard;

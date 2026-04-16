import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Source URL (post page) or external news URL */
  sourceUrl?: string;
  /** Default text to seed AI quote extraction (e.g., excerpt + content) */
  defaultText?: string;
}

const PhotocardModal = ({ open, onOpenChange, sourceUrl, defaultText }: Props) => {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [text, setText] = useState(defaultText ?? "");
  const [manualQuote, setManualQuote] = useState("");
  const [size, setSize] = useState<"square" | "portrait" | "landscape">("square");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ image: string; quote: string } | null>(null);

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = { size };
      if (mode === "manual") {
        if (!manualQuote.trim()) {
          toast.error("কোটেশন লিখুন");
          setLoading(false);
          return;
        }
        body.quote = manualQuote.trim();
        if (sourceUrl) body.url = sourceUrl;
      } else {
        if (text.trim()) body.text = text.trim();
        else if (sourceUrl) body.url = sourceUrl;
        else {
          toast.error("টেক্সট অথবা URL দিন");
          setLoading(false);
          return;
        }
      }
      const { data, error } = await supabase.functions.invoke("generate-photocard", {
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ image: data.image, quote: data.quote });
      toast.success("ফটোকার্ড তৈরি হয়েছে");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ত্রুটি";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">AI ফটোকার্ড বানান</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "auto" ? "default" : "outline"}
              onClick={() => setMode("auto")}
            >
              <Wand2 className="h-4 w-4 mr-1" /> অটো (AI কোটেশন)
            </Button>
            <Button
              size="sm"
              variant={mode === "manual" ? "default" : "outline"}
              onClick={() => setMode("manual")}
            >
              নিজে লিখব
            </Button>
          </div>

          {mode === "auto" ? (
            <div>
              <Label>সংক্ষিপ্ত / সম্পূর্ণ টেক্সট (AI এখান থেকে কোটেশন বের করবে)</Label>
              <Textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="খালি রাখলে পোস্টের URL থেকে AI টেনে নেবে"
              />
            </div>
          ) : (
            <div>
              <Label>আপনার কোটেশন (সর্বোচ্চ ২৫ শব্দ)</Label>
              <Textarea
                rows={3}
                value={manualQuote}
                onChange={(e) => setManualQuote(e.target.value)}
                placeholder="এখানে আপনার বাছাই করা লাইন লিখুন..."
              />
            </div>
          )}

          <div>
            <Label>কার্ড সাইজ</Label>
            <Select value={size} onValueChange={(v) => setSize(v as typeof size)}>
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

          {result && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="relative">
                <img
                  src={result.image}
                  alt="photocard"
                  className="w-full max-w-md mx-auto"
                />
              </div>
              <blockquote className="italic text-center text-foreground border-l-4 border-primary pl-3">
                &ldquo;{result.quote}&rdquo;
              </blockquote>
              <a
                href={result.image}
                download="photocard.png"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 mx-auto w-fit rounded font-semibold"
              >
                <Download className="h-4 w-4" /> ডাউনলোড
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotocardModal;

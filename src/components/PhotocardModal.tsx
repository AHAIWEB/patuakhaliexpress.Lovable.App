import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Wand2, Facebook, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourceUrl?: string;
  defaultText?: string;
  defaultCategory?: string;
  categoryId?: string | null;
}

type CardStyle = "minimal" | "bold" | "classic" | "photo";
type CardSize = "square" | "portrait" | "landscape";

const STYLE_OPTIONS: { value: CardStyle; label: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", desc: "সাদা bg, বড় কোটেশন" },
  { value: "bold", label: "Bold Magazine", desc: "Gradient + accent bar" },
  { value: "classic", label: "Newspaper Classic", desc: "Cream + double-rule" },
  { value: "photo", label: "Photo Overlay", desc: "AI bg image + overlay" },
];

const PhotocardModal = ({
  open,
  onOpenChange,
  sourceUrl,
  defaultText,
  defaultCategory,
  categoryId,
}: Props) => {
  const isMobile = useIsMobile();
  const settings = useSiteSettings();
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [text, setText] = useState(defaultText ?? "");
  const [manualQuote, setManualQuote] = useState("");
  const [manualDetail, setManualDetail] = useState("");
  const [attribution, setAttribution] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [style, setStyle] = useState<CardStyle>("minimal");
  const [size, setSize] = useState<CardSize>("square");
  const [useSiteLogo, setUseSiteLogo] = useState(true);
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ image: string; quote: string; detail?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("লোগো ২MB-এর কম হতে হবে");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCustomLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const logo_url = useSiteLogo ? settings.logo_url : customLogoUrl || null;
      const body: Record<string, unknown> = {
        size,
        style,
        site_name: settings.site_name,
        logo_url,
      };
      if (categoryId) body.category_id = categoryId;
      if (category.trim()) body.category = category.trim();
      if (attribution.trim()) body.attribution = attribution.trim();

      if (mode === "manual") {
        if (!manualQuote.trim()) {
          toast.error("কোটেশন লিখুন");
          setLoading(false);
          return;
        }
        body.quote = manualQuote.trim();
        if (manualDetail.trim()) body.detail = manualDetail.trim();
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
      const { data, error } = await supabase.functions.invoke("generate-photocard", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({ image: data.image, quote: data.quote, detail: data.detail });
      toast.success("ফটোকার্ড তৈরি হয়েছে");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ত্রুটি";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const Body = (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={mode === "auto" ? "default" : "outline"} onClick={() => setMode("auto")} className="flex-1">
          <Wand2 className="h-4 w-4 mr-1" /> অটো (AI)
        </Button>
        <Button size="sm" variant={mode === "manual" ? "default" : "outline"} onClick={() => setMode("manual")} className="flex-1">
          নিজে লিখব
        </Button>
      </div>

      {mode === "auto" ? (
        <div>
          <Label>সংক্ষিপ্ত / সম্পূর্ণ টেক্সট</Label>
          <Textarea
            rows={isMobile ? 3 : 5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="খালি রাখলে পোস্টের URL থেকে AI টেনে নেবে"
            className="resize-none"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>আপনার কোটেশন (সর্বোচ্চ ২৫ শব্দ)</Label>
            <Textarea
              rows={2}
              value={manualQuote}
              onChange={(e) => setManualQuote(e.target.value)}
              placeholder="মূল লাইন..."
              className="resize-none"
            />
          </div>
          <div>
            <Label>বিস্তারিত / সাব-টেক্সট (ঐচ্ছিক)</Label>
            <Textarea
              rows={2}
              value={manualDetail}
              onChange={(e) => setManualDetail(e.target.value)}
              placeholder="ছোট ব্যাখ্যা বা প্রসঙ্গ..."
              className="resize-none"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>অ্যাট্রিবিউশন (ঐচ্ছিক)</Label>
          <Input
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="বক্তা / উৎস"
          />
        </div>
        <div>
          <Label>ক্যাটাগরি ব্যাজ</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="যেমন: রাজনীতি"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block">কার্ড স্টাইল</Label>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_OPTIONS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStyle(s.value)}
              className={`text-left p-2.5 rounded border text-xs transition-colors ${
                style === s.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-muted-foreground">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>কার্ড সাইজ</Label>
        <Select value={size} onValueChange={(v) => setSize(v as CardSize)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="square">স্কয়ার (1:1)</SelectItem>
            <SelectItem value="portrait">পোর্ট্রেট (3:4)</SelectItem>
            <SelectItem value="landscape">ল্যান্ডস্কেপ (16:9)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded p-3 space-y-2">
        <Label className="text-xs font-semibold">লোগো</Label>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setUseSiteLogo(true)}
            className={`flex-1 px-3 py-1.5 rounded border ${
              useSiteLogo ? "border-primary bg-primary/10" : "border-border"
            }`}
          >
            সাইট লোগো {settings.logo_url ? "✓" : "(নেই)"}
          </button>
          <button
            type="button"
            onClick={() => setUseSiteLogo(false)}
            className={`flex-1 px-3 py-1.5 rounded border ${
              !useSiteLogo ? "border-primary bg-primary/10" : "border-border"
            }`}
          >
            কাস্টম
          </button>
        </div>
        {!useSiteLogo && (
          <div className="flex gap-2 items-center">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-3.5 w-3.5 mr-1" /> আপলোড
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {customLogoUrl && (
              <>
                <img src={customLogoUrl} alt="logo" className="h-8 w-8 object-contain rounded border border-border" />
                <button
                  type="button"
                  onClick={() => setCustomLogoUrl("")}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <Button onClick={generate} disabled={loading} className="w-full" size="lg">
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> জেনারেট হচ্ছে...</>
        ) : (
          "ফটোকার্ড বানান"
        )}
      </Button>

      {result && (
        <div className="space-y-3 border-t border-border pt-4">
          <img src={result.image} alt="photocard" className="w-full max-w-md mx-auto rounded" />
          <blockquote className="italic text-center text-foreground border-l-4 border-primary pl-3 text-sm">
            &ldquo;{result.quote}&rdquo;
          </blockquote>
          {result.detail && (
            <p className="text-center text-xs text-muted-foreground">{result.detail}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={result.image}
              download="photocard.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold hover:bg-[hsl(var(--primary-glow))] transition-colors"
            >
              <Download className="h-4 w-4" /> ডাউনলোড
            </a>
            <button
              type="button"
              onClick={() =>
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(result.image)}`,
                  "_blank",
                  "noopener,noreferrer,width=600,height=500"
                )
              }
              className="inline-flex items-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded font-semibold hover:opacity-90 transition-opacity"
            >
              <Facebook className="h-4 w-4" /> Facebook
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-headline text-left">AI ফটোকার্ড বানান</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{Body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">AI ফটোকার্ড বানান</DialogTitle>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
};

export default PhotocardModal;

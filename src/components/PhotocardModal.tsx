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
import {
  Loader2,
  Download,
  Wand2,
  Facebook,
  Upload,
  X,
  Image as ImageIcon,
  Type,
  ListOrdered,
  ImagePlus,
  Plus,
  Trash2,
} from "lucide-react";
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
  onGenerated?: () => void | Promise<void>;
}

type CardStyle = "minimal" | "bold" | "classic" | "photo" | "quote-mark" | "infographic";
type CardSize = "square" | "portrait" | "landscape";
type Mode = "text" | "image-text" | "image-only" | "infographic";

const STYLE_OPTIONS: { value: CardStyle; label: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", desc: "সাদা bg, বড় কোটেশন" },
  { value: "bold", label: "Bold Magazine", desc: "Gradient + accent bar" },
  { value: "classic", label: "Newspaper", desc: "Cream + double-rule" },
  { value: "photo", label: "Photo Overlay", desc: "AI bg image + overlay" },
  { value: "quote-mark", label: "Quote Mark", desc: "বড় উদ্ধৃতি চিহ্ন" },
  { value: "infographic", label: "Infographic", desc: "Bullet/stat ব্লক" },
];

const MODE_OPTIONS: { value: Mode; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "text", label: "টেক্সট/কোটেশন", desc: "শুধু লেখা থেকে কার্ড", icon: <Type className="h-4 w-4" /> },
  { value: "image-text", label: "টেক্সট + ছবি", desc: "আপনার ছবি + AI টাইপোগ্রাফি", icon: <ImagePlus className="h-4 w-4" /> },
  { value: "image-only", label: "শুধু ছবি", desc: "AI ছবি পড়ে ক্যাপশন", icon: <ImageIcon className="h-4 w-4" /> },
  { value: "infographic", label: "ইনফোগ্রাফিক", desc: "Bullet/stat কার্ড", icon: <ListOrdered className="h-4 w-4" /> },
];

const PhotocardModal = ({
  open,
  onOpenChange,
  sourceUrl,
  defaultText,
  defaultCategory,
  categoryId,
  onGenerated,
}: Props) => {
  const isMobile = useIsMobile();
  const settings = useSiteSettings();
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState(defaultText ?? "");
  const [manualQuote, setManualQuote] = useState("");
  const [manualDetail, setManualDetail] = useState("");
  const [bullets, setBullets] = useState<string[]>(["", "", ""]);
  const [attribution, setAttribution] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? "");
  const [style, setStyle] = useState<CardStyle>("minimal");
  const [size, setSize] = useState<CardSize>("square");
  const [useSiteLogo, setUseSiteLogo] = useState(true);
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [userImage, setUserImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    image: string;
    quote: string;
    detail?: string;
    bullets?: string[] | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userImgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
  }, [defaultCategory]);

  // Auto-pick a sensible style when mode changes
  useEffect(() => {
    if (mode === "infographic") setStyle("infographic");
    else if ((mode === "image-text" || mode === "image-only") && (style === "minimal" || style === "infographic"))
      setStyle("photo");
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const readFileAsDataUrl = (file: File, maxMB: number) =>
    new Promise<string>((resolve, reject) => {
      if (file.size > maxMB * 1024 * 1024) {
        reject(new Error(`ফাইল ${maxMB}MB-এর কম হতে হবে`));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("ফাইল পড়া যায়নি"));
      reader.readAsDataURL(file);
    });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readFileAsDataUrl(file, 2);
      setCustomLogoUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ত্রুটি");
    }
  };

  const handleUserImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readFileAsDataUrl(file, 8);
      setUserImage(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ত্রুটি");
    }
  };

  const setBulletAt = (i: number, v: string) => {
    setBullets((prev) => prev.map((b, idx) => (idx === i ? v : b)));
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const logo_url = useSiteLogo ? settings.logo_url : customLogoUrl || null;
      const body: Record<string, unknown> = {
        size,
        style,
        mode,
        site_name: settings.site_name,
        logo_url,
      };
      if (categoryId) body.category_id = categoryId;
      if (category.trim()) body.category = category.trim();
      if (attribution.trim()) body.attribution = attribution.trim();

      // Mode-specific payload
      if (mode === "image-only") {
        if (!userImage) {
          toast.error("একটি ছবি আপলোড করুন");
          setLoading(false);
          return;
        }
        body.image_data_url = userImage;
        if (manualQuote.trim()) body.quote = manualQuote.trim();
      } else if (mode === "image-text") {
        if (!userImage) {
          toast.error("একটি ছবি আপলোড করুন");
          setLoading(false);
          return;
        }
        if (!manualQuote.trim()) {
          toast.error("টেক্সট/কোটেশন লিখুন");
          setLoading(false);
          return;
        }
        body.image_data_url = userImage;
        body.quote = manualQuote.trim();
        if (manualDetail.trim()) body.detail = manualDetail.trim();
      } else if (mode === "infographic") {
        const cleanBullets = bullets.map((b) => b.trim()).filter(Boolean);
        if (manualQuote.trim()) body.quote = manualQuote.trim();
        if (manualDetail.trim()) body.detail = manualDetail.trim();
        if (cleanBullets.length) body.bullets = cleanBullets;
        if (text.trim()) body.text = text.trim();
        else if (sourceUrl) body.url = sourceUrl;
        if (!body.quote && !cleanBullets.length && !body.text && !body.url) {
          toast.error("টাইটেল, bullets, টেক্সট বা URL দিন");
          setLoading(false);
          return;
        }
      } else {
        // text mode
        if (manualQuote.trim()) {
          body.quote = manualQuote.trim();
          if (manualDetail.trim()) body.detail = manualDetail.trim();
          if (sourceUrl) body.url = sourceUrl;
        } else if (text.trim()) {
          body.text = text.trim();
        } else if (sourceUrl) {
          body.url = sourceUrl;
        } else {
          toast.error("টেক্সট, কোটেশন, অথবা URL দিন");
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-photocard", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult({
        image: data.image,
        quote: data.quote,
        detail: data.detail,
        bullets: data.bullets,
      });
      await onGenerated?.();
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
      {/* Mode Picker */}
      <div>
        <Label className="mb-2 block text-xs">ইনপুট মোড</Label>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`text-left p-2.5 rounded border text-xs transition-colors ${
                mode === m.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <div className="font-semibold text-sm flex items-center gap-1.5">
                {m.icon} {m.label}
              </div>
              <div className="text-muted-foreground mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Image upload for image-text / image-only */}
      {(mode === "image-text" || mode === "image-only") && (
        <div className="border border-border rounded p-3 space-y-2 bg-muted/30">
          <Label className="text-xs font-semibold">আপনার ছবি</Label>
          {userImage ? (
            <div className="relative">
              <img src={userImage} alt="upload" className="w-full max-h-48 object-contain rounded" />
              <button
                type="button"
                onClick={() => setUserImage("")}
                className="absolute top-1 right-1 bg-background/90 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => userImgInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> ছবি বেছে নিন (max 8MB)
            </Button>
          )}
          <input
            ref={userImgInputRef}
            type="file"
            accept="image/*"
            onChange={handleUserImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Text inputs */}
      {mode === "text" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">কোটেশন (নিজে লিখুন বা ফাঁকা রাখুন)</Label>
            <Textarea
              rows={2}
              value={manualQuote}
              onChange={(e) => setManualQuote(e.target.value)}
              placeholder="মূল লাইন... খালি রাখলে নিচের টেক্সট/URL থেকে AI বের করবে"
              className="resize-none"
            />
          </div>
          <div>
            <Label className="text-xs">বিস্তারিত (ঐচ্ছিক)</Label>
            <Textarea
              rows={2}
              value={manualDetail}
              onChange={(e) => setManualDetail(e.target.value)}
              placeholder="ছোট ব্যাখ্যা..."
              className="resize-none"
            />
          </div>
          <div>
            <Label className="text-xs">অথবা সম্পূর্ণ টেক্সট (AI summarize করবে)</Label>
            <Textarea
              rows={isMobile ? 3 : 4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="পুরো প্যারাগ্রাফ..."
              className="resize-none"
            />
          </div>
        </div>
      )}

      {mode === "image-text" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">আপনার লেখা / কোটেশন</Label>
            <Textarea
              rows={2}
              value={manualQuote}
              onChange={(e) => setManualQuote(e.target.value)}
              placeholder="ছবির উপর যে লেখা চান..."
              className="resize-none"
            />
          </div>
          <div>
            <Label className="text-xs">সাব-টেক্সট (ঐচ্ছিক)</Label>
            <Textarea
              rows={2}
              value={manualDetail}
              onChange={(e) => setManualDetail(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
      )}

      {mode === "image-only" && (
        <div>
          <Label className="text-xs">কোটেশন (ঐচ্ছিক — খালি রাখলে AI ছবি দেখে লিখবে)</Label>
          <Textarea
            rows={2}
            value={manualQuote}
            onChange={(e) => setManualQuote(e.target.value)}
            placeholder="ফাঁকা রাখুন → AI ক্যাপশন তৈরি করবে"
            className="resize-none"
          />
        </div>
      )}

      {mode === "infographic" && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">টাইটেল</Label>
            <Input
              value={manualQuote}
              onChange={(e) => setManualQuote(e.target.value)}
              placeholder="যেমন: ২০২৫ এর প্রধান ৫টি ঘটনা"
            />
          </div>
          <div>
            <Label className="text-xs">সাব-টেক্সট (ঐচ্ছিক)</Label>
            <Input value={manualDetail} onChange={(e) => setManualDetail(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs flex items-center justify-between">
              <span>Bullet পয়েন্ট ({bullets.length})</span>
              <button
                type="button"
                onClick={() => setBullets((b) => [...b, ""])}
                className="text-primary text-xs inline-flex items-center gap-1"
                disabled={bullets.length >= 6}
              >
                <Plus className="h-3 w-3" /> যোগ
              </button>
            </Label>
            <div className="space-y-1.5">
              {bullets.map((b, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                  <Input
                    value={b}
                    onChange={(e) => setBulletAt(i, e.target.value)}
                    placeholder={`Bullet ${i + 1}`}
                    className="flex-1"
                  />
                  {bullets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBullets((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">অ্যাট্রিবিউশন (ঐচ্ছিক)</Label>
          <Input
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="বক্তা / উৎস"
          />
        </div>
        <div>
          <Label className="text-xs">ক্যাটাগরি ব্যাজ</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="যেমন: রাজনীতি"
          />
        </div>
      </div>

      <div>
        <Label className="mb-2 block text-xs">কার্ড স্টাইল</Label>
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
        <Label className="text-xs">কার্ড সাইজ</Label>
        <Select value={size} onValueChange={(v) => setSize(v as CardSize)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="square">স্কয়ার (1:1) — Instagram</SelectItem>
            <SelectItem value="portrait">পোর্ট্রেট (3:4) — Story/Reels</SelectItem>
            <SelectItem value="landscape">ল্যান্ডস্কেপ (16:9) — Facebook/Twitter</SelectItem>
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
          <><Wand2 className="h-4 w-4 mr-2" /> ফটোকার্ড বানান</>
        )}
      </Button>

      {result && (
        <div className="space-y-3 border-t border-border pt-4">
          <img src={result.image} alt="photocard" className="w-full max-w-md mx-auto rounded shadow-lg" />
          <blockquote className="italic text-center text-foreground border-l-4 border-primary pl-3 text-sm">
            &ldquo;{result.quote}&rdquo;
          </blockquote>
          {result.detail && (
            <p className="text-center text-xs text-muted-foreground">{result.detail}</p>
          )}
          {result.bullets && result.bullets.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1 max-w-md mx-auto">
              {result.bullets.map((b, i) => (
                <li key={i}>• {b}</li>
              ))}
            </ul>
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

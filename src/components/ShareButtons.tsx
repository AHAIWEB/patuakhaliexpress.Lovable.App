import { Facebook, Twitter, Link2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  url?: string;
  title?: string;
  /** If true, render compact icon-only buttons */
  compact?: boolean;
}

const ShareButtons = ({ url, title = "", compact = false }: Props) => {
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title);

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${enc}`;
  const tw = `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}`;
  const wa = `https://wa.me/?text=${encTitle}%20${enc}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("লিংক কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");

  const size = compact ? "icon" : "sm";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {!compact && <span className="text-sm text-muted-foreground">শেয়ার:</span>}
      <Button
        size={size}
        variant="outline"
        onClick={() => open(fb)}
        className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-0"
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
        {!compact && <span className="ml-1">Facebook</span>}
      </Button>
      <Button
        size={size}
        variant="outline"
        onClick={() => open(wa)}
        className="bg-[#25D366] hover:bg-[#25D366]/90 text-white border-0"
        aria-label="Share on WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
        {!compact && <span className="ml-1">WhatsApp</span>}
      </Button>
      <Button
        size={size}
        variant="outline"
        onClick={() => open(tw)}
        className="bg-foreground hover:bg-foreground/90 text-background border-0"
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" />
        {!compact && <span className="ml-1">X</span>}
      </Button>
      <Button size={size} variant="outline" onClick={copy} aria-label="Copy link">
        <Link2 className="h-4 w-4" />
        {!compact && <span className="ml-1">কপি</span>}
      </Button>
    </div>
  );
};

export default ShareButtons;

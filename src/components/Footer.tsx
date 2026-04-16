import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--headline))] text-primary-foreground/90 mt-12">
      <div className="container-news py-8 grid gap-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-primary text-primary-foreground font-headline text-xl px-3 py-1.5 leading-none">
              পটুয়াখালী
            </div>
            <div className="font-headline text-xl">এক্সপ্রেস</div>
          </div>
          <p className="text-sm opacity-80">
            সর্বশেষ বাংলা সংবাদ এক জায়গায় — জাতীয়, রাজনীতি, আন্তর্জাতিক, খেলা ও বিভাগীয়।
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">দ্রুত লিংক</h4>
          <ul className="space-y-1.5 text-sm opacity-80">
            <li><Link to="/" className="hover:text-primary-foreground">হোম</Link></li>
            <li><Link to="/photocard" className="hover:text-primary-foreground">ফটোকার্ড</Link></li>
            <li><Link to="/auth" className="hover:text-primary-foreground">লগইন</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">যোগাযোগ</h4>
          <p className="text-sm opacity-80">পটুয়াখালী, বাংলাদেশ</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs opacity-70">
        © {new Date().getFullYear()} পটুয়াখালী এক্সপ্রেস। সর্বস্বত্ব সংরক্ষিত।
      </div>
    </footer>
  );
};

export default Footer;

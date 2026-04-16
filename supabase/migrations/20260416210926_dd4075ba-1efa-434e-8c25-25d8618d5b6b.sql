
-- ============ DIVISIONS ============
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bn_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Divisions public read" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Admins manage divisions" ON public.divisions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON public.divisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DISTRICTS ============
CREATE TABLE public.districts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bn_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_districts_division ON public.districts(division_id);
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Districts public read" ON public.districts FOR SELECT USING (true);
CREATE POLICY "Admins manage districts" ON public.districts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON public.districts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ UPAZILAS ============
CREATE TABLE public.upazilas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bn_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(district_id, slug)
);

CREATE INDEX idx_upazilas_district ON public.upazilas(district_id);
ALTER TABLE public.upazilas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Upazilas public read" ON public.upazilas FOR SELECT USING (true);
CREATE POLICY "Admins manage upazilas" ON public.upazilas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_upazilas_updated_at BEFORE UPDATE ON public.upazilas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CATEGORIES: parent_id for nesting ============
ALTER TABLE public.categories ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX idx_categories_parent ON public.categories(parent_id);

-- ============ POSTS: geo columns ============
ALTER TABLE public.posts
  ADD COLUMN division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
  ADD COLUMN district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
  ADD COLUMN upazila_id  UUID REFERENCES public.upazilas(id)  ON DELETE SET NULL;

CREATE INDEX idx_posts_division ON public.posts(division_id);
CREATE INDEX idx_posts_district ON public.posts(district_id);
CREATE INDEX idx_posts_upazila  ON public.posts(upazila_id);

-- ============ HOME SECTIONS ============
CREATE TABLE public.home_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'category', -- category | featured | latest | geo | photocards | custom
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  division_id UUID REFERENCES public.divisions(id) ON DELETE SET NULL,
  variant TEXT NOT NULL DEFAULT 'grid', -- grid | list | hero | carousel | compact
  item_count INTEGER NOT NULL DEFAULT 6,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Home sections public read visible" ON public.home_sections FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins read all home sections" ON public.home_sections FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage home sections" ON public.home_sections FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON public.home_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED: 8 DIVISIONS ============
INSERT INTO public.divisions (name, bn_name, slug, display_order) VALUES
  ('Dhaka','ঢাকা','dhaka',1),
  ('Chattogram','চট্টগ্রাম','chattogram',2),
  ('Rajshahi','রাজশাহী','rajshahi',3),
  ('Khulna','খুলনা','khulna',4),
  ('Barishal','বরিশাল','barishal',5),
  ('Sylhet','সিলেট','sylhet',6),
  ('Rangpur','রংপুর','rangpur',7),
  ('Mymensingh','ময়মনসিংহ','mymensingh',8);

-- ============ SEED: 64 DISTRICTS ============
INSERT INTO public.districts (division_id, name, bn_name, slug)
SELECT d.id, x.name, x.bn_name, x.slug FROM public.divisions d JOIN (VALUES
  -- Dhaka (13)
  ('dhaka','Dhaka','ঢাকা','dhaka'),
  ('dhaka','Faridpur','ফরিদপুর','faridpur'),
  ('dhaka','Gazipur','গাজীপুর','gazipur'),
  ('dhaka','Gopalganj','গোপালগঞ্জ','gopalganj'),
  ('dhaka','Kishoreganj','কিশোরগঞ্জ','kishoreganj'),
  ('dhaka','Madaripur','মাদারীপুর','madaripur'),
  ('dhaka','Manikganj','মানিকগঞ্জ','manikganj'),
  ('dhaka','Munshiganj','মুন্সিগঞ্জ','munshiganj'),
  ('dhaka','Narayanganj','নারায়ণগঞ্জ','narayanganj'),
  ('dhaka','Narsingdi','নরসিংদী','narsingdi'),
  ('dhaka','Rajbari','রাজবাড়ী','rajbari'),
  ('dhaka','Shariatpur','শরীয়তপুর','shariatpur'),
  ('dhaka','Tangail','টাঙ্গাইল','tangail'),
  -- Chattogram (11)
  ('chattogram','Bandarban','বান্দরবান','bandarban'),
  ('chattogram','Brahmanbaria','ব্রাহ্মণবাড়িয়া','brahmanbaria'),
  ('chattogram','Chandpur','চাঁদপুর','chandpur'),
  ('chattogram','Chattogram','চট্টগ্রাম','chattogram'),
  ('chattogram','Cumilla','কুমিল্লা','cumilla'),
  ('chattogram','Coxs Bazar','কক্সবাজার','coxs-bazar'),
  ('chattogram','Feni','ফেনী','feni'),
  ('chattogram','Khagrachhari','খাগড়াছড়ি','khagrachhari'),
  ('chattogram','Lakshmipur','লক্ষ্মীপুর','lakshmipur'),
  ('chattogram','Noakhali','নোয়াখালী','noakhali'),
  ('chattogram','Rangamati','রাঙ্গামাটি','rangamati'),
  -- Rajshahi (8)
  ('rajshahi','Bogura','বগুড়া','bogura'),
  ('rajshahi','Joypurhat','জয়পুরহাট','joypurhat'),
  ('rajshahi','Naogaon','নওগাঁ','naogaon'),
  ('rajshahi','Natore','নাটোর','natore'),
  ('rajshahi','Chapainawabganj','চাঁপাইনবাবগঞ্জ','chapainawabganj'),
  ('rajshahi','Pabna','পাবনা','pabna'),
  ('rajshahi','Rajshahi','রাজশাহী','rajshahi'),
  ('rajshahi','Sirajganj','সিরাজগঞ্জ','sirajganj'),
  -- Khulna (10)
  ('khulna','Bagerhat','বাগেরহাট','bagerhat'),
  ('khulna','Chuadanga','চুয়াডাঙ্গা','chuadanga'),
  ('khulna','Jashore','যশোর','jashore'),
  ('khulna','Jhenaidah','ঝিনাইদহ','jhenaidah'),
  ('khulna','Khulna','খুলনা','khulna'),
  ('khulna','Kushtia','কুষ্টিয়া','kushtia'),
  ('khulna','Magura','মাগুরা','magura'),
  ('khulna','Meherpur','মেহেরপুর','meherpur'),
  ('khulna','Narail','নড়াইল','narail'),
  ('khulna','Satkhira','সাতক্ষীরা','satkhira'),
  -- Barishal (6)
  ('barishal','Barguna','বরগুনা','barguna'),
  ('barishal','Barishal','বরিশাল','barishal'),
  ('barishal','Bhola','ভোলা','bhola'),
  ('barishal','Jhalokathi','ঝালকাঠি','jhalokathi'),
  ('barishal','Patuakhali','পটুয়াখালী','patuakhali'),
  ('barishal','Pirojpur','পিরোজপুর','pirojpur'),
  -- Sylhet (4)
  ('sylhet','Habiganj','হবিগঞ্জ','habiganj'),
  ('sylhet','Moulvibazar','মৌলভীবাজার','moulvibazar'),
  ('sylhet','Sunamganj','সুনামগঞ্জ','sunamganj'),
  ('sylhet','Sylhet','সিলেট','sylhet'),
  -- Rangpur (8)
  ('rangpur','Dinajpur','দিনাজপুর','dinajpur'),
  ('rangpur','Gaibandha','গাইবান্ধা','gaibandha'),
  ('rangpur','Kurigram','কুড়িগ্রাম','kurigram'),
  ('rangpur','Lalmonirhat','লালমনিরহাট','lalmonirhat'),
  ('rangpur','Nilphamari','নীলফামারী','nilphamari'),
  ('rangpur','Panchagarh','পঞ্চগড়','panchagarh'),
  ('rangpur','Rangpur','রংপুর','rangpur'),
  ('rangpur','Thakurgaon','ঠাকুরগাঁও','thakurgaon'),
  -- Mymensingh (4)
  ('mymensingh','Jamalpur','জামালপুর','jamalpur'),
  ('mymensingh','Mymensingh','ময়মনসিংহ','mymensingh'),
  ('mymensingh','Netrokona','নেত্রকোনা','netrokona'),
  ('mymensingh','Sherpur','শেরপুর','sherpur')
) AS x(div_slug, name, bn_name, slug) ON d.slug = x.div_slug;

-- ============ SEED: UPAZILAS (compact set per district) ============
INSERT INTO public.upazilas (district_id, name, bn_name, slug)
SELECT dt.id, x.name, x.bn_name, x.slug FROM public.districts dt JOIN (VALUES
  -- Dhaka division
  ('dhaka','Dhamrai','ধামরাই','dhamrai'),('dhaka','Dohar','দোহার','dohar'),('dhaka','Keraniganj','কেরাণীগঞ্জ','keraniganj'),('dhaka','Nawabganj','নবাবগঞ্জ','nawabganj'),('dhaka','Savar','সাভার','savar'),
  ('faridpur','Faridpur Sadar','ফরিদপুর সদর','faridpur-sadar'),('faridpur','Bhanga','ভাঙ্গা','bhanga'),('faridpur','Boalmari','বোয়ালমারী','boalmari'),('faridpur','Madhukhali','মধুখালী','madhukhali'),('faridpur','Nagarkanda','নগরকান্দা','nagarkanda'),('faridpur','Sadarpur','সদরপুর','sadarpur'),('faridpur','Charbhadrasan','চরভদ্রাসন','charbhadrasan'),('faridpur','Alfadanga','আলফাডাঙ্গা','alfadanga'),('faridpur','Saltha','সালথা','saltha'),
  ('gazipur','Gazipur Sadar','গাজীপুর সদর','gazipur-sadar'),('gazipur','Kaliakair','কালিয়াকৈর','kaliakair'),('gazipur','Kaliganj','কালীগঞ্জ','kaliganj-gazipur'),('gazipur','Kapasia','কাপাসিয়া','kapasia'),('gazipur','Sreepur','শ্রীপুর','sreepur-gazipur'),
  ('gopalganj','Gopalganj Sadar','গোপালগঞ্জ সদর','gopalganj-sadar'),('gopalganj','Kashiani','কাশিয়ানী','kashiani'),('gopalganj','Kotalipara','কোটালীপাড়া','kotalipara'),('gopalganj','Muksudpur','মুকসুদপুর','muksudpur'),('gopalganj','Tungipara','টুঙ্গিপাড়া','tungipara'),
  ('kishoreganj','Kishoreganj Sadar','কিশোরগঞ্জ সদর','kishoreganj-sadar'),('kishoreganj','Bajitpur','বাজিতপুর','bajitpur'),('kishoreganj','Bhairab','ভৈরব','bhairab'),('kishoreganj','Hossainpur','হোসেনপুর','hossainpur'),('kishoreganj','Itna','ইটনা','itna'),('kishoreganj','Karimganj','করিমগঞ্জ','karimganj'),('kishoreganj','Katiadi','কটিয়াদী','katiadi'),('kishoreganj','Kuliarchar','কুলিয়ারচর','kuliarchar'),('kishoreganj','Mithamain','মিঠামইন','mithamain'),('kishoreganj','Nikli','নিকলী','nikli'),('kishoreganj','Pakundia','পাকুন্দিয়া','pakundia'),('kishoreganj','Tarail','তাড়াইল','tarail'),('kishoreganj','Austagram','অষ্টগ্রাম','austagram'),
  ('madaripur','Madaripur Sadar','মাদারীপুর সদর','madaripur-sadar'),('madaripur','Kalkini','কালকিনি','kalkini'),('madaripur','Rajoir','রাজৈর','rajoir'),('madaripur','Shibchar','শিবচর','shibchar'),
  ('manikganj','Manikganj Sadar','মানিকগঞ্জ সদর','manikganj-sadar'),('manikganj','Daulatpur','দৌলতপুর','daulatpur-manikganj'),('manikganj','Ghior','ঘিওর','ghior'),('manikganj','Harirampur','হরিরামপুর','harirampur'),('manikganj','Saturia','সাটুরিয়া','saturia'),('manikganj','Shibalaya','শিবালয়','shibalaya'),('manikganj','Singair','সিংগাইর','singair'),
  ('munshiganj','Munshiganj Sadar','মুন্সিগঞ্জ সদর','munshiganj-sadar'),('munshiganj','Gazaria','গজারিয়া','gazaria'),('munshiganj','Lohajang','লৌহজং','lohajang'),('munshiganj','Sirajdikhan','সিরাজদিখান','sirajdikhan'),('munshiganj','Sreenagar','শ্রীনগর','sreenagar'),('munshiganj','Tongibari','টংগীবাড়ী','tongibari'),
  ('narayanganj','Narayanganj Sadar','নারায়ণগঞ্জ সদর','narayanganj-sadar'),('narayanganj','Araihazar','আড়াইহাজার','araihazar'),('narayanganj','Bandar','বন্দর','bandar'),('narayanganj','Rupganj','রূপগঞ্জ','rupganj'),('narayanganj','Sonargaon','সোনারগাঁও','sonargaon'),
  ('narsingdi','Narsingdi Sadar','নরসিংদী সদর','narsingdi-sadar'),('narsingdi','Belabo','বেলাবো','belabo'),('narsingdi','Monohardi','মনোহরদী','monohardi'),('narsingdi','Palash','পলাশ','palash'),('narsingdi','Raipura','রায়পুরা','raipura'),('narsingdi','Shibpur','শিবপুর','shibpur'),
  ('rajbari','Rajbari Sadar','রাজবাড়ী সদর','rajbari-sadar'),('rajbari','Baliakandi','বালিয়াকান্দি','baliakandi'),('rajbari','Goalandaghat','গোয়ালন্দ','goalandaghat'),('rajbari','Pangsha','পাংশা','pangsha'),('rajbari','Kalukhali','কালুখালী','kalukhali'),
  ('shariatpur','Shariatpur Sadar','শরীয়তপুর সদর','shariatpur-sadar'),('shariatpur','Bhedarganj','ভেদরগঞ্জ','bhedarganj'),('shariatpur','Damudya','ডামুড্যা','damudya'),('shariatpur','Gosairhat','গোসাইরহাট','gosairhat'),('shariatpur','Naria','নড়িয়া','naria'),('shariatpur','Zajira','জাজিরা','zajira'),
  ('tangail','Tangail Sadar','টাঙ্গাইল সদর','tangail-sadar'),('tangail','Basail','বাসাইল','basail'),('tangail','Bhuapur','ভূঞাপুর','bhuapur'),('tangail','Delduar','দেলদুয়ার','delduar'),('tangail','Ghatail','ঘাটাইল','ghatail'),('tangail','Gopalpur','গোপালপুর','gopalpur-tangail'),('tangail','Kalihati','কালিহাতী','kalihati'),('tangail','Madhupur','মধুপুর','madhupur'),('tangail','Mirzapur','মির্জাপুর','mirzapur'),('tangail','Nagarpur','নাগরপুর','nagarpur'),('tangail','Sakhipur','সখিপুর','sakhipur'),('tangail','Dhanbari','ধনবাড়ী','dhanbari'),
  -- Chattogram
  ('bandarban','Bandarban Sadar','বান্দরবান সদর','bandarban-sadar'),('bandarban','Alikadam','আলীকদম','alikadam'),('bandarban','Lama','লামা','lama'),('bandarban','Naikhongchhari','নাইক্ষ্যংছড়ি','naikhongchhari'),('bandarban','Rowangchhari','রোয়াংছড়ি','rowangchhari'),('bandarban','Ruma','রুমা','ruma'),('bandarban','Thanchi','থানচি','thanchi'),
  ('brahmanbaria','Brahmanbaria Sadar','ব্রাহ্মণবাড়িয়া সদর','brahmanbaria-sadar'),('brahmanbaria','Akhaura','আখাউড়া','akhaura'),('brahmanbaria','Ashuganj','আশুগঞ্জ','ashuganj'),('brahmanbaria','Bancharampur','বাঞ্ছারামপুর','bancharampur'),('brahmanbaria','Kasba','কসবা','kasba'),('brahmanbaria','Nabinagar','নবীনগর','nabinagar'),('brahmanbaria','Nasirnagar','নাসিরনগর','nasirnagar'),('brahmanbaria','Sarail','সরাইল','sarail'),('brahmanbaria','Bijoynagar','বিজয়নগর','bijoynagar'),
  ('chandpur','Chandpur Sadar','চাঁদপুর সদর','chandpur-sadar'),('chandpur','Faridganj','ফরিদগঞ্জ','faridganj'),('chandpur','Haimchar','হাইমচর','haimchar'),('chandpur','Haziganj','হাজীগঞ্জ','haziganj'),('chandpur','Kachua','কচুয়া','kachua-chandpur'),('chandpur','Matlab Dakshin','মতলব দক্ষিণ','matlab-dakshin'),('chandpur','Matlab Uttar','মতলব উত্তর','matlab-uttar'),('chandpur','Shahrasti','শাহরাস্তি','shahrasti'),
  ('chattogram','Anwara','আনোয়ারা','anwara'),('chattogram','Banshkhali','বাঁশখালী','banshkhali'),('chattogram','Boalkhali','বোয়ালখালী','boalkhali'),('chattogram','Chandanaish','চন্দনাইশ','chandanaish'),('chattogram','Fatikchhari','ফটিকছড়ি','fatikchhari'),('chattogram','Hathazari','হাটহাজারী','hathazari'),('chattogram','Lohagara','লোহাগাড়া','lohagara-chattogram'),('chattogram','Mirsharai','মীরসরাই','mirsharai'),('chattogram','Patiya','পটিয়া','patiya'),('chattogram','Rangunia','রাঙ্গুনিয়া','rangunia'),('chattogram','Raozan','রাউজান','raozan'),('chattogram','Sandwip','সন্দ্বীপ','sandwip'),('chattogram','Satkania','সাতকানিয়া','satkania'),('chattogram','Sitakunda','সীতাকুণ্ড','sitakunda'),('chattogram','Karnaphuli','কর্ণফুলী','karnaphuli'),
  ('cumilla','Cumilla Sadar','কুমিল্লা সদর','cumilla-sadar'),('cumilla','Barura','বরুড়া','barura'),('cumilla','Brahmanpara','ব্রাহ্মণপাড়া','brahmanpara'),('cumilla','Burichang','বুড়িচং','burichang'),('cumilla','Chandina','চান্দিনা','chandina'),('cumilla','Chauddagram','চৌদ্দগ্রাম','chauddagram'),('cumilla','Daudkandi','দাউদকান্দি','daudkandi'),('cumilla','Debidwar','দেবিদ্বার','debidwar'),('cumilla','Homna','হোমনা','homna'),('cumilla','Laksam','লাকসাম','laksam'),('cumilla','Manoharganj','মনোহরগঞ্জ','manoharganj'),('cumilla','Meghna','মেঘনা','meghna'),('cumilla','Muradnagar','মুরাদনগর','muradnagar'),('cumilla','Nangalkot','নাঙ্গলকোট','nangalkot'),('cumilla','Cumilla Sadar Dakshin','কুমিল্লা সদর দক্ষিণ','cumilla-sadar-dakshin'),('cumilla','Titas','তিতাস','titas'),('cumilla','Lalmai','লালমাই','lalmai'),
  ('coxs-bazar','Coxs Bazar Sadar','কক্সবাজার সদর','coxs-bazar-sadar'),('coxs-bazar','Chakaria','চকরিয়া','chakaria'),('coxs-bazar','Kutubdia','কুতুবদিয়া','kutubdia'),('coxs-bazar','Maheshkhali','মহেশখালী','maheshkhali'),('coxs-bazar','Pekua','পেকুয়া','pekua'),('coxs-bazar','Ramu','রামু','ramu'),('coxs-bazar','Teknaf','টেকনাফ','teknaf'),('coxs-bazar','Ukhia','উখিয়া','ukhia'),
  ('feni','Feni Sadar','ফেনী সদর','feni-sadar'),('feni','Chhagalnaiya','ছাগলনাইয়া','chhagalnaiya'),('feni','Daganbhuiyan','দাগনভূঞা','daganbhuiyan'),('feni','Parshuram','পরশুরাম','parshuram'),('feni','Sonagazi','সোনাগাজী','sonagazi'),('feni','Fulgazi','ফুলগাজী','fulgazi'),
  ('khagrachhari','Khagrachhari Sadar','খাগড়াছড়ি সদর','khagrachhari-sadar'),('khagrachhari','Dighinala','দিঘীনালা','dighinala'),('khagrachhari','Lakshmichhari','লক্ষীছড়ি','lakshmichhari'),('khagrachhari','Mahalchhari','মহালছড়ি','mahalchhari'),('khagrachhari','Manikchhari','মানিকছড়ি','manikchhari'),('khagrachhari','Matiranga','মাটিরাঙ্গা','matiranga'),('khagrachhari','Panchhari','পানছড়ি','panchhari'),('khagrachhari','Ramgarh','রামগড়','ramgarh'),
  ('lakshmipur','Lakshmipur Sadar','লক্ষ্মীপুর সদর','lakshmipur-sadar'),('lakshmipur','Kamalnagar','কমলনগর','kamalnagar'),('lakshmipur','Raipur','রায়পুর','raipur-lakshmipur'),('lakshmipur','Ramganj','রামগঞ্জ','ramganj'),('lakshmipur','Ramgati','রামগতি','ramgati'),
  ('noakhali','Noakhali Sadar','নোয়াখালী সদর','noakhali-sadar'),('noakhali','Begumganj','বেগমগঞ্জ','begumganj'),('noakhali','Chatkhil','চাটখিল','chatkhil'),('noakhali','Companiganj','কোম্পানীগঞ্জ','companiganj-noakhali'),('noakhali','Hatiya','হাতিয়া','hatiya'),('noakhali','Senbagh','সেনবাগ','senbagh'),('noakhali','Sonaimuri','সোনাইমুড়ী','sonaimuri'),('noakhali','Subarnachar','সুবর্ণচর','subarnachar'),('noakhali','Kabirhat','কবিরহাট','kabirhat'),
  ('rangamati','Rangamati Sadar','রাঙ্গামাটি সদর','rangamati-sadar'),('rangamati','Baghaichhari','বাঘাইছড়ি','baghaichhari'),('rangamati','Barkal','বরকল','barkal'),('rangamati','Belaichhari','বিলাইছড়ি','belaichhari'),('rangamati','Juraichhari','জুরাছড়ি','juraichhari'),('rangamati','Kaptai','কাপ্তাই','kaptai'),('rangamati','Kawkhali','কাউখালী','kawkhali-rangamati'),('rangamati','Langadu','লংগদু','langadu'),('rangamati','Naniarchar','নানিয়ারচর','naniarchar'),('rangamati','Rajasthali','রাজস্থলী','rajasthali'),
  -- Rajshahi
  ('bogura','Bogura Sadar','বগুড়া সদর','bogura-sadar'),('bogura','Adamdighi','আদমদীঘি','adamdighi'),('bogura','Dhunat','ধুনট','dhunat'),('bogura','Dhupchanchia','দুপচাঁচিয়া','dhupchanchia'),('bogura','Gabtali','গাবতলী','gabtali'),('bogura','Kahaloo','কাহালু','kahaloo'),('bogura','Nandigram','নন্দীগ্রাম','nandigram'),('bogura','Sahajanpur','শাজাহানপুর','sahajanpur'),('bogura','Sariakandi','সারিয়াকান্দি','sariakandi'),('bogura','Sherpur','শেরপুর','sherpur-bogura'),('bogura','Shibganj','শিবগঞ্জ','shibganj-bogura'),('bogura','Sonatala','সোনাতলা','sonatala'),
  ('joypurhat','Joypurhat Sadar','জয়পুরহাট সদর','joypurhat-sadar'),('joypurhat','Akkelpur','আক্কেলপুর','akkelpur'),('joypurhat','Kalai','কালাই','kalai'),('joypurhat','Khetlal','ক্ষেতলাল','khetlal'),('joypurhat','Panchbibi','পাঁচবিবি','panchbibi'),
  ('naogaon','Naogaon Sadar','নওগাঁ সদর','naogaon-sadar'),('naogaon','Atrai','আত্রাই','atrai'),('naogaon','Badalgachhi','বদলগাছী','badalgachhi'),('naogaon','Dhamoirhat','ধামইরহাট','dhamoirhat'),('naogaon','Manda','মান্দা','manda'),('naogaon','Mahadebpur','মহাদেবপুর','mahadebpur'),('naogaon','Niamatpur','নিয়ামতপুর','niamatpur'),('naogaon','Patnitala','পত্নীতলা','patnitala'),('naogaon','Porsha','পোরশা','porsha'),('naogaon','Raninagar','রাণীনগর','raninagar'),('naogaon','Sapahar','সাপাহার','sapahar'),
  ('natore','Natore Sadar','নাটোর সদর','natore-sadar'),('natore','Bagatipara','বাগাতিপাড়া','bagatipara'),('natore','Baraigram','বড়াইগ্রাম','baraigram'),('natore','Gurudaspur','গুরুদাসপুর','gurudaspur'),('natore','Lalpur','লালপুর','lalpur'),('natore','Singra','সিংড়া','singra'),('natore','Naldanga','নলডাঙ্গা','naldanga'),
  ('chapainawabganj','Chapainawabganj Sadar','চাঁপাইনবাবগঞ্জ সদর','chapainawabganj-sadar'),('chapainawabganj','Bholahat','ভোলাহাট','bholahat'),('chapainawabganj','Gomastapur','গোমস্তাপুর','gomastapur'),('chapainawabganj','Nachole','নাচোল','nachole'),('chapainawabganj','Shibganj','শিবগঞ্জ','shibganj-chapai'),
  ('pabna','Pabna Sadar','পাবনা সদর','pabna-sadar'),('pabna','Atgharia','আটঘরিয়া','atgharia'),('pabna','Bera','বেড়া','bera'),('pabna','Bhangura','ভাঙ্গুড়া','bhangura'),('pabna','Chatmohar','চাটমোহর','chatmohar'),('pabna','Faridpur','ফরিদপুর','faridpur-pabna'),('pabna','Ishwardi','ঈশ্বরদী','ishwardi'),('pabna','Santhia','সাঁথিয়া','santhia'),('pabna','Sujanagar','সুজানগর','sujanagar'),
  ('rajshahi','Bagha','বাঘা','bagha'),('rajshahi','Bagmara','বাগমারা','bagmara'),('rajshahi','Charghat','চারঘাট','charghat'),('rajshahi','Durgapur','দুর্গাপুর','durgapur-rajshahi'),('rajshahi','Godagari','গোদাগাড়ী','godagari'),('rajshahi','Mohanpur','মোহনপুর','mohanpur'),('rajshahi','Paba','পবা','paba'),('rajshahi','Puthia','পুঠিয়া','puthia'),('rajshahi','Tanore','তানোর','tanore'),
  ('sirajganj','Sirajganj Sadar','সিরাজগঞ্জ সদর','sirajganj-sadar'),('sirajganj','Belkuchi','বেলকুচি','belkuchi'),('sirajganj','Chauhali','চৌহালী','chauhali'),('sirajganj','Kamarkhanda','কামারখন্দ','kamarkhanda'),('sirajganj','Kazipur','কাজীপুর','kazipur'),('sirajganj','Raiganj','রায়গঞ্জ','raiganj'),('sirajganj','Shahjadpur','শাহজাদপুর','shahjadpur'),('sirajganj','Tarash','তাড়াশ','tarash'),('sirajganj','Ullahpara','উল্লাপাড়া','ullahpara'),
  -- Khulna
  ('bagerhat','Bagerhat Sadar','বাগেরহাট সদর','bagerhat-sadar'),('bagerhat','Chitalmari','চিতলমারী','chitalmari'),('bagerhat','Fakirhat','ফকিরহাট','fakirhat'),('bagerhat','Kachua','কচুয়া','kachua-bagerhat'),('bagerhat','Mollahat','মোল্লাহাট','mollahat'),('bagerhat','Mongla','মোংলা','mongla'),('bagerhat','Morrelganj','মোড়েলগঞ্জ','morrelganj'),('bagerhat','Rampal','রামপাল','rampal'),('bagerhat','Sarankhola','শরণখোলা','sarankhola'),
  ('chuadanga','Chuadanga Sadar','চুয়াডাঙ্গা সদর','chuadanga-sadar'),('chuadanga','Alamdanga','আলমডাঙ্গা','alamdanga'),('chuadanga','Damurhuda','দামুড়হুদা','damurhuda'),('chuadanga','Jibannagar','জীবননগর','jibannagar'),
  ('jashore','Jashore Sadar','যশোর সদর','jashore-sadar'),('jashore','Abhaynagar','অভয়নগর','abhaynagar'),('jashore','Bagherpara','বাঘারপাড়া','bagherpara'),('jashore','Chaugachha','চৌগাছা','chaugachha'),('jashore','Jhikargachha','ঝিকরগাছা','jhikargachha'),('jashore','Keshabpur','কেশবপুর','keshabpur'),('jashore','Manirampur','মণিরামপুর','manirampur'),('jashore','Sharsha','শার্শা','sharsha'),
  ('jhenaidah','Jhenaidah Sadar','ঝিনাইদহ সদর','jhenaidah-sadar'),('jhenaidah','Harinakunda','হরিণাকুন্ডু','harinakunda'),('jhenaidah','Kaliganj','কালীগঞ্জ','kaliganj-jhenaidah'),('jhenaidah','Kotchandpur','কোটচাঁদপুর','kotchandpur'),('jhenaidah','Maheshpur','মহেশপুর','maheshpur'),('jhenaidah','Shailkupa','শৈলকুপা','shailkupa'),
  ('khulna','Batiaghata','বটিয়াঘাটা','batiaghata'),('khulna','Dacope','দাকোপ','dacope'),('khulna','Dumuria','ডুমুরিয়া','dumuria'),('khulna','Dighalia','দিঘলিয়া','dighalia'),('khulna','Koyra','কয়রা','koyra'),('khulna','Paikgachha','পাইকগাছা','paikgachha'),('khulna','Phultala','ফুলতলা','phultala'),('khulna','Rupsa','রূপসা','rupsa'),('khulna','Terokhada','তেরখাদা','terokhada'),
  ('kushtia','Kushtia Sadar','কুষ্টিয়া সদর','kushtia-sadar'),('kushtia','Bheramara','ভেড়ামারা','bheramara'),('kushtia','Daulatpur','দৌলতপুর','daulatpur-kushtia'),('kushtia','Khoksa','খোকসা','khoksa'),('kushtia','Kumarkhali','কুমারখালী','kumarkhali'),('kushtia','Mirpur','মিরপুর','mirpur-kushtia'),
  ('magura','Magura Sadar','মাগুরা সদর','magura-sadar'),('magura','Mohammadpur','মহম্মদপুর','mohammadpur'),('magura','Shalikha','শালিখা','shalikha'),('magura','Sreepur','শ্রীপুর','sreepur-magura'),
  ('meherpur','Meherpur Sadar','মেহেরপুর সদর','meherpur-sadar'),('meherpur','Gangni','গাংনী','gangni'),('meherpur','Mujibnagar','মুজিবনগর','mujibnagar'),
  ('narail','Narail Sadar','নড়াইল সদর','narail-sadar'),('narail','Kalia','কালিয়া','kalia'),('narail','Lohagara','লোহাগড়া','lohagara-narail'),
  ('satkhira','Satkhira Sadar','সাতক্ষীরা সদর','satkhira-sadar'),('satkhira','Assasuni','আশাশুনি','assasuni'),('satkhira','Debhata','দেবহাটা','debhata'),('satkhira','Kalaroa','কলারোয়া','kalaroa'),('satkhira','Kaliganj','কালীগঞ্জ','kaliganj-satkhira'),('satkhira','Shyamnagar','শ্যামনগর','shyamnagar'),('satkhira','Tala','তালা','tala'),
  -- Barishal
  ('barguna','Barguna Sadar','বরগুনা সদর','barguna-sadar'),('barguna','Amtali','আমতলী','amtali'),('barguna','Bamna','বামনা','bamna'),('barguna','Betagi','বেতাগী','betagi'),('barguna','Patharghata','পাথরঘাটা','patharghata'),('barguna','Taltali','তালতলী','taltali'),
  ('barishal','Barishal Sadar','বরিশাল সদর','barishal-sadar'),('barishal','Agailjhara','আগৈলঝাড়া','agailjhara'),('barishal','Babuganj','বাবুগঞ্জ','babuganj'),('barishal','Bakerganj','বাকেরগঞ্জ','bakerganj'),('barishal','Banaripara','বানারীপাড়া','banaripara'),('barishal','Gaurnadi','গৌরনদী','gaurnadi'),('barishal','Hizla','হিজলা','hizla'),('barishal','Mehendiganj','মেহেন্দিগঞ্জ','mehendiganj'),('barishal','Muladi','মুলাদী','muladi'),('barishal','Wazirpur','উজিরপুর','wazirpur'),
  ('bhola','Bhola Sadar','ভোলা সদর','bhola-sadar'),('bhola','Burhanuddin','বোরহানউদ্দিন','burhanuddin'),('bhola','Char Fasson','চরফ্যাশন','char-fasson'),('bhola','Daulatkhan','দৌলতখান','daulatkhan'),('bhola','Lalmohan','লালমোহন','lalmohan'),('bhola','Manpura','মনপুরা','manpura'),('bhola','Tazumuddin','তজুমদ্দিন','tazumuddin'),
  ('jhalokathi','Jhalokathi Sadar','ঝালকাঠি সদর','jhalokathi-sadar'),('jhalokathi','Kathalia','কাঠালিয়া','kathalia'),('jhalokathi','Nalchity','নলছিটি','nalchity'),('jhalokathi','Rajapur','রাজাপুর','rajapur'),
  ('patuakhali','Patuakhali Sadar','পটুয়াখালী সদর','patuakhali-sadar'),('patuakhali','Bauphal','বাউফল','bauphal'),('patuakhali','Dashmina','দশমিনা','dashmina'),('patuakhali','Dumki','দুমকি','dumki'),('patuakhali','Galachipa','গলাচিপা','galachipa'),('patuakhali','Kalapara','কলাপাড়া','kalapara'),('patuakhali','Mirzaganj','মির্জাগঞ্জ','mirzaganj'),('patuakhali','Rangabali','রাঙ্গাবালী','rangabali'),
  ('pirojpur','Pirojpur Sadar','পিরোজপুর সদর','pirojpur-sadar'),('pirojpur','Bhandaria','ভান্ডারিয়া','bhandaria'),('pirojpur','Kawkhali','কাউখালী','kawkhali-pirojpur'),('pirojpur','Mathbaria','মঠবাড়িয়া','mathbaria'),('pirojpur','Nazirpur','নাজিরপুর','nazirpur'),('pirojpur','Nesarabad','নেছারাবাদ','nesarabad'),('pirojpur','Zianagar','জিয়ানগর','zianagar'),
  -- Sylhet
  ('habiganj','Habiganj Sadar','হবিগঞ্জ সদর','habiganj-sadar'),('habiganj','Ajmiriganj','আজমিরীগঞ্জ','ajmiriganj'),('habiganj','Bahubal','বাহুবল','bahubal'),('habiganj','Baniachong','বানিয়াচং','baniachong'),('habiganj','Chunarughat','চুনারুঘাট','chunarughat'),('habiganj','Lakhai','লাখাই','lakhai'),('habiganj','Madhabpur','মাধবপুর','madhabpur'),('habiganj','Nabiganj','নবীগঞ্জ','nabiganj'),('habiganj','Shaistaganj','শায়েস্তাগঞ্জ','shaistaganj'),
  ('moulvibazar','Moulvibazar Sadar','মৌলভীবাজার সদর','moulvibazar-sadar'),('moulvibazar','Barlekha','বড়লেখা','barlekha'),('moulvibazar','Juri','জুড়ী','juri'),('moulvibazar','Kamalganj','কমলগঞ্জ','kamalganj'),('moulvibazar','Kulaura','কুলাউড়া','kulaura'),('moulvibazar','Rajnagar','রাজনগর','rajnagar'),('moulvibazar','Sreemangal','শ্রীমঙ্গল','sreemangal'),
  ('sunamganj','Sunamganj Sadar','সুনামগঞ্জ সদর','sunamganj-sadar'),('sunamganj','Bishwamvarpur','বিশ্বম্ভরপুর','bishwamvarpur'),('sunamganj','Chhatak','ছাতক','chhatak'),('sunamganj','Dakshin Sunamganj','দক্ষিণ সুনামগঞ্জ','dakshin-sunamganj'),('sunamganj','Derai','দিরাই','derai'),('sunamganj','Dharampasha','ধর্মপাশা','dharampasha'),('sunamganj','Dowarabazar','দোয়ারাবাজার','dowarabazar'),('sunamganj','Jagannathpur','জগন্নাথপুর','jagannathpur'),('sunamganj','Jamalganj','জামালগঞ্জ','jamalganj'),('sunamganj','Sulla','শাল্লা','sulla'),('sunamganj','Tahirpur','তাহিরপুর','tahirpur'),
  ('sylhet','Balaganj','বালাগঞ্জ','balaganj'),('sylhet','Beanibazar','বিয়ানীবাজার','beanibazar'),('sylhet','Bishwanath','বিশ্বনাথ','bishwanath'),('sylhet','Companiganj','কোম্পানীগঞ্জ','companiganj-sylhet'),('sylhet','Dakshin Surma','দক্ষিণ সুরমা','dakshin-surma'),('sylhet','Fenchuganj','ফেঞ্চুগঞ্জ','fenchuganj'),('sylhet','Golapganj','গোলাপগঞ্জ','golapganj'),('sylhet','Gowainghat','গোয়াইনঘাট','gowainghat'),('sylhet','Jaintiapur','জৈন্তাপুর','jaintiapur'),('sylhet','Kanaighat','কানাইঘাট','kanaighat'),('sylhet','Osmaninagar','ওসমানীনগর','osmaninagar'),('sylhet','Sylhet Sadar','সিলেট সদর','sylhet-sadar'),('sylhet','Zakiganj','জকিগঞ্জ','zakiganj'),
  -- Rangpur
  ('dinajpur','Dinajpur Sadar','দিনাজপুর সদর','dinajpur-sadar'),('dinajpur','Birampur','বিরামপুর','birampur'),('dinajpur','Birganj','বীরগঞ্জ','birganj'),('dinajpur','Biral','বিরল','biral'),('dinajpur','Bochaganj','বোচাগঞ্জ','bochaganj'),('dinajpur','Chirirbandar','চিরিরবন্দর','chirirbandar'),('dinajpur','Phulbari','ফুলবাড়ী','phulbari-dinajpur'),('dinajpur','Ghoraghat','ঘোড়াঘাট','ghoraghat'),('dinajpur','Hakimpur','হাকিমপুর','hakimpur'),('dinajpur','Kaharole','কাহারোল','kaharole'),('dinajpur','Khansama','খানসামা','khansama'),('dinajpur','Nawabganj','নবাবগঞ্জ','nawabganj-dinajpur'),('dinajpur','Parbatipur','পার্বতীপুর','parbatipur'),
  ('gaibandha','Gaibandha Sadar','গাইবান্ধা সদর','gaibandha-sadar'),('gaibandha','Phulchhari','ফুলছড়ি','phulchhari'),('gaibandha','Gobindaganj','গোবিন্দগঞ্জ','gobindaganj'),('gaibandha','Palashbari','পলাশবাড়ী','palashbari'),('gaibandha','Sadullapur','সাদুল্লাপুর','sadullapur'),('gaibandha','Saghata','সাঘাটা','saghata'),('gaibandha','Sundarganj','সুন্দরগঞ্জ','sundarganj'),
  ('kurigram','Kurigram Sadar','কুড়িগ্রাম সদর','kurigram-sadar'),('kurigram','Bhurungamari','ভূরুঙ্গামারী','bhurungamari'),('kurigram','Char Rajibpur','চর রাজিবপুর','char-rajibpur'),('kurigram','Chilmari','চিলমারী','chilmari'),('kurigram','Phulbari','ফুলবাড়ী','phulbari-kurigram'),('kurigram','Nageshwari','নাগেশ্বরী','nageshwari'),('kurigram','Rajarhat','রাজারহাট','rajarhat'),('kurigram','Raomari','রৌমারী','raomari'),('kurigram','Ulipur','উলিপুর','ulipur'),
  ('lalmonirhat','Lalmonirhat Sadar','লালমনিরহাট সদর','lalmonirhat-sadar'),('lalmonirhat','Aditmari','আদিতমারী','aditmari'),('lalmonirhat','Hatibandha','হাতীবান্ধা','hatibandha'),('lalmonirhat','Kaliganj','কালীগঞ্জ','kaliganj-lalmonirhat'),('lalmonirhat','Patgram','পাটগ্রাম','patgram'),
  ('nilphamari','Nilphamari Sadar','নীলফামারী সদর','nilphamari-sadar'),('nilphamari','Dimla','ডিমলা','dimla'),('nilphamari','Domar','ডোমার','domar'),('nilphamari','Jaldhaka','জলঢাকা','jaldhaka'),('nilphamari','Kishoreganj','কিশোরগঞ্জ','kishoreganj-nilphamari'),('nilphamari','Saidpur','সৈয়দপুর','saidpur'),
  ('panchagarh','Panchagarh Sadar','পঞ্চগড় সদর','panchagarh-sadar'),('panchagarh','Atwari','আটোয়ারী','atwari'),('panchagarh','Boda','বোদা','boda'),('panchagarh','Debiganj','দেবীগঞ্জ','debiganj'),('panchagarh','Tetulia','তেতুলিয়া','tetulia'),
  ('rangpur','Rangpur Sadar','রংপুর সদর','rangpur-sadar'),('rangpur','Badarganj','বদরগঞ্জ','badarganj'),('rangpur','Gangachara','গংগাচড়া','gangachara'),('rangpur','Kaunia','কাউনিয়া','kaunia'),('rangpur','Mithapukur','মিঠাপুকুর','mithapukur'),('rangpur','Pirgachha','পীরগাছা','pirgachha'),('rangpur','Pirganj','পীরগঞ্জ','pirganj-rangpur'),('rangpur','Taraganj','তারাগঞ্জ','taraganj'),
  ('thakurgaon','Thakurgaon Sadar','ঠাকুরগাঁও সদর','thakurgaon-sadar'),('thakurgaon','Baliadangi','বালিয়াডাঙ্গী','baliadangi'),('thakurgaon','Haripur','হরিপুর','haripur-thakurgaon'),('thakurgaon','Pirganj','পীরগঞ্জ','pirganj-thakurgaon'),('thakurgaon','Ranisankail','রাণীশংকৈল','ranisankail'),
  -- Mymensingh
  ('jamalpur','Jamalpur Sadar','জামালপুর সদর','jamalpur-sadar'),('jamalpur','Baksiganj','বকশীগঞ্জ','baksiganj'),('jamalpur','Dewanganj','দেওয়ানগঞ্জ','dewanganj'),('jamalpur','Islampur','ইসলামপুর','islampur'),('jamalpur','Madarganj','মাদারগঞ্জ','madarganj'),('jamalpur','Melandaha','মেলান্দহ','melandaha'),('jamalpur','Sarishabari','সরিষাবাড়ী','sarishabari'),
  ('mymensingh','Mymensingh Sadar','ময়মনসিংহ সদর','mymensingh-sadar'),('mymensingh','Bhaluka','ভালুকা','bhaluka'),('mymensingh','Dhobaura','ধোবাউড়া','dhobaura'),('mymensingh','Phulbaria','ফুলবাড়ীয়া','phulbaria'),('mymensingh','Fulpur','ফুলপুর','fulpur'),('mymensingh','Gafargaon','গফরগাঁও','gafargaon'),('mymensingh','Gauripur','গৌরীপুর','gauripur'),('mymensingh','Haluaghat','হালুয়াঘাট','haluaghat'),('mymensingh','Ishwarganj','ঈশ্বরগঞ্জ','ishwarganj'),('mymensingh','Muktagachha','মুক্তাগাছা','muktagachha'),('mymensingh','Nandail','নান্দাইল','nandail'),('mymensingh','Trishal','ত্রিশাল','trishal'),('mymensingh','Tarakanda','তারাকান্দা','tarakanda'),
  ('netrokona','Netrokona Sadar','নেত্রকোনা সদর','netrokona-sadar'),('netrokona','Atpara','আটপাড়া','atpara'),('netrokona','Barhatta','বারহাট্টা','barhatta'),('netrokona','Durgapur','দুর্গাপুর','durgapur-netrokona'),('netrokona','Khaliajuri','খালিয়াজুরী','khaliajuri'),('netrokona','Kalmakanda','কলমাকান্দা','kalmakanda'),('netrokona','Kendua','কেন্দুয়া','kendua'),('netrokona','Madan','মদন','madan'),('netrokona','Mohanganj','মোহনগঞ্জ','mohanganj'),('netrokona','Purbadhala','পূর্বধলা','purbadhala'),
  ('sherpur','Sherpur Sadar','শেরপুর সদর','sherpur-sadar'),('sherpur','Jhenaigati','ঝিনাইগাতী','jhenaigati'),('sherpur','Nakla','নকলা','nakla'),('sherpur','Nalitabari','নালিতাবাড়ী','nalitabari'),('sherpur','Sreebardi','শ্রীবরদী','sreebardi')
) AS x(dist_slug, name, bn_name, slug) ON dt.slug = x.dist_slug;

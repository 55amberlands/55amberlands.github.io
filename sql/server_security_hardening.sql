-- Server-side input validation and least-privilege hardening.
-- No player balances, inventory or combat formulas are changed.
DO $hardening$
DECLARE t record;
BEGIN
 FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p') AND c.relname LIKE 'amber_%' LOOP
 EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE %I.%I FROM PUBLIC, anon, authenticated',t.nspname,t.relname);
 END LOOP;
END $hardening$;

CREATE OR REPLACE FUNCTION private.amber_market_buy_impl(p_id bigint, p_qty integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE u uuid:=(select auth.uid()); l public.amber_market_listings%rowtype;buyer jsonb; total bigint; newqty int;receipt_id bigint;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Google Login required'; END IF;
 IF p_id IS NULL OR p_qty IS NULL OR p_qty NOT BETWEEN 1 AND 9999 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
 SELECT * INTO l FROM public.amber_market_listings WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR l.status<>'active' OR p_qty>l.quantity THEN RAISE EXCEPTION 'Listing unavailable or insufficient stock'; END IF;
 IF l.seller_id=u THEN RAISE EXCEPTION 'Cannot buy your own listing'; END IF;
 IF l.item_kind='gear' AND p_qty<>1 THEN RAISE EXCEPTION 'Gear quantity must be one'; END IF;
 PERFORM 1 FROM public.amber_characters WHERE user_id IN (u,l.seller_id) ORDER BY user_id FOR UPDATE;
 SELECT save_data INTO buyer FROM public.amber_characters WHERE user_id=u;
 IF buyer IS NULL OR NOT EXISTS(SELECT 1 FROM public.amber_characters WHERE user_id=l.seller_id) THEN RAISE EXCEPTION 'Character not found'; END IF;
 total=l.unit_price::bigint*p_qty::bigint;
 IF total>1000000000 THEN RAISE EXCEPTION 'Price exceeds allowed maximum'; END IF;
 IF coalesce((buyer->>'gold')::bigint,0)<total THEN RAISE EXCEPTION 'Not enough Gold'; END IF;
 buyer=private.amber_v291_market_move(buyer,l.item_kind,l.item_key,p_qty,l.item_data);
 buyer=pg_catalog.jsonb_set(buyer,'{gold}',pg_catalog.to_jsonb(coalesce((buyer->>'gold')::bigint,0)-total),true);
 UPDATE public.amber_characters SET save_data=buyer,market_version=market_version+1,updated_at=now() WHERE user_id=u;
 newqty=l.quantity-p_qty;
 UPDATE public.amber_market_listings SET quantity=newqty,status=CASE WHEN newqty=0 THEN 'sold' ELSE 'active' END,updated_at=now() WHERE id=p_id;
 INSERT INTO public.amber_market_sales(listing_id,seller_id,buyer_id,item_name,quantity,gold_amount)
 VALUES(l.id,l.seller_id,u,l.item_name,p_qty,total) RETURNING id INTO receipt_id;
 RETURN pg_catalog.jsonb_build_object('id',p_id,'item_name',l.item_name,'quantity',p_qty,'gold',total,'sale_id',receipt_id);
END $function$;

CREATE OR REPLACE FUNCTION private.amber_market_post_impl(p_kind text, p_key text, p_quantity integer, p_price integer)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare u uuid:=(select auth.uid()); s jsonb; itm jsonb; nm text; lid bigint; cnt int;
begin
 if u is null then raise exception 'Google Login required'; end if;
 if p_quantity is null or p_price is null or p_quantity not between 1 and 9999 or p_price not between 1 and 10000000 then raise exception 'Invalid quantity or price'; end if;
 if p_kind is null or p_key is null or p_key='' or p_kind not in ('bag','potion','material','gear','pet','shop') or pg_catalog.length(p_key)>128 then raise exception 'Invalid item type'; end if;
 perform 1 from public.amber_characters where user_id=u for update;
 select pg_catalog.count(*) into cnt from public.amber_market_listings where seller_id=u and status='active';
 if cnt>=20 then raise exception 'Limit 20 active listings'; end if;
 select save_data into s from public.amber_characters where user_id=u for update;
 if s is null then raise exception 'Character not found'; end if;
 if p_kind='bag' then
   select value into itm from pg_catalog.jsonb_array_elements(coalesce(s->'bag','[]'::jsonb)) as e(value) where value->>'id'=p_key limit 1;
   if itm is null then raise exception 'Item not found'; end if;
   nm=pg_catalog.left(coalesce(itm->>'name','ไอเทม'),100);
 elsif p_kind='gear' then
   if p_quantity<>1 then raise exception 'Gear is sold one piece at a time'; end if;
   select value into itm from pg_catalog.jsonb_array_elements(coalesce(s->'gear','[]'::jsonb)) as e(value) where value->>'id'=p_key limit 1;
   if itm is null then raise exception 'Gear not found'; end if;
   nm=pg_catalog.left(coalesce(itm->>'name','อุปกรณ์'),100);
 elsif p_kind='material' then
   nm=case p_key when 'gw' then 'เพชรเพลิงมังกร' when 'ga' then 'ไข่มุกพิทักษ์'
   when 'ore_fire' then 'แร่อัคคี' when 'ore_ice' then 'แร่เหมันต์'
   when 'ore_prism' then 'แร่รุ้งดารา' else null end;
   if nm is null then raise exception 'Invalid material'; end if;
   itm=pg_catalog.jsonb_build_object('id',p_key,'name',nm);
 elsif p_kind='pet' then
   if p_quantity>9999 then raise exception 'V291_PET_QTY_TOO_LARGE'; end if;
   select value into itm from pg_catalog.jsonb_array_elements(coalesce(s#>'{pet23,items}','[]'::jsonb)) e(value)
     where value->>'id'=p_key limit 1;
   if itm is null or coalesce((itm->>'qty')::int,0)<p_quantity then raise exception 'V291_PET_ITEM_NOT_OWNED'; end if;
   nm=case itm->>'sku' when 'dog' then 'ลูกสุนัขผู้พิทักษ์' when 'food' then 'อาหารสุนัขวิเศษ'
    when 'duo' then 'บัตร DUO Pet Skill' when 'shield' then 'ตำราเกราะพิทักษ์'
    when 'regen' then 'ตำราฟื้นฟู HP/MP' when 'attack' then 'ตำราพลังนักล่า' else null end;
   if nm is null then raise exception 'V291_BAD_PET_SKU'; end if;
 elsif p_kind='shop' then
   if p_quantity<>1 then raise exception 'V291_SHOP_ITEM_QTY_ONE'; end if;
   select value into itm from pg_catalog.jsonb_array_elements(coalesce(s#>'{shop20,owned}','[]'::jsonb)) e(value)
     where value->>'id'=p_key limit 1;
   if itm is null then raise exception 'V291_SHOP_NOT_OWNED'; end if;
   nm=case when itm->>'sku' like 'sun_%' then 'ปีกสุริยันสวรรค์'
      when itm->>'sku' like 'moon_%' then 'ปีกจันทรารัตติกาล'
      when itm->>'sku'='reset_skill' then 'น้ำยารีเซ็ตสกิล'
      when itm->>'sku'='reset_stat' then 'น้ำยารีเซ็ตสเตตัส' else null end;
   if nm is null then raise exception 'V291_BAD_SHOP_SKU'; end if;
 else
   nm=case p_key when 'hp' then 'ยาฟื้น HP' when 'mp' then 'ยาฟื้น MP' else null end;
   if nm is null then raise exception 'Invalid potion'; end if;
   itm=pg_catalog.jsonb_build_object('id',p_key,'name',nm);
 end if;
 s=private.amber_v291_market_move(s,p_kind,p_key,-p_quantity, itm);
 update public.amber_characters set save_data=s,market_version=market_version+1,updated_at=now() where user_id=u;
 insert into public.amber_market_listings(seller_id,seller_name,item_kind,item_key,item_name,item_data,quantity,unit_price)
 values(u,(select display_name from public.amber_profiles where user_id=u),p_kind,p_key,nm,itm,p_quantity,p_price) returning id into lid;
 return lid;
end $function$;

CREATE OR REPLACE FUNCTION public.amber_create_character(p_name text, p_gender text, p_save jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 u uuid:=(SELECT auth.uid()); name_text text:=btrim(coalesce(p_name,''));
 s jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'LOGIN_REQUIRED'; END IF;
 IF char_length(name_text) NOT BETWEEN 2 AND 16 OR name_text !~ '^[[:alnum:]_ก-๙ ]+$' THEN RAISE EXCEPTION 'CHARACTER_NAME_INVALID'; END IF;
 IF p_gender IS NULL OR p_gender NOT IN ('male','female') THEN RAISE EXCEPTION 'INVALID_GENDER'; END IF;
 IF EXISTS(SELECT 1 FROM public.amber_profiles WHERE user_id=u AND character_created=true)
 OR EXISTS(SELECT 1 FROM public.amber_characters WHERE user_id=u AND save_data->>'character_created'='true') THEN
   RAISE EXCEPTION 'CHARACTER_ALREADY_EXISTS';
 END IF;
 -- V27.7 rejects ALL client-supplied starter balances, gear, stats, items, and levels.
 s:=jsonb_build_object('name',name_text,'gender',p_gender,'character_created',true,
 'lv',1,'xp',0,'gold',1000,'gems',100000,'hp',250,'mp',120,
 'stats',jsonb_build_object('STR',15,'DEX',12,'INT',5,'VIT',10,'AGI',8,'LUK',5),
 'points',0,'map','school','mob','school_0','potHP',1008,'potMP',1008,
 'bag',jsonb_build_array(
   jsonb_build_object('id','sword','name','ดาบฝึกหัด','qty',1,'atk',12,'icon','⚔️'),
   jsonb_build_object('id','hp','name','ยาฟื้น HP','qty',8,'icon','🧪'),
   jsonb_build_object('id','mp','name','ยาฟื้น MP','qty',8,'icon','💧')),
 'equip','ดาบฝึกหัด','kills',0,'damage',0,'party',1,'job','นักผจญภัย',
 'learned','[]'::jsonb,'skillPoints',0,'autopot',true,'auto',false,'autoSkill',true,
 'hpthreshold',70,'mpthreshold',50,'log','[]'::jsonb);
 INSERT INTO public.amber_profiles(user_id,display_name,gender,character_created,updated_at)
 VALUES(u,name_text,p_gender,true,now())
 ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,gender=EXCLUDED.gender,
 character_created=true,updated_at=now()
 WHERE public.amber_profiles.character_created=false;
 IF NOT FOUND THEN RAISE EXCEPTION 'CHARACTER_ALREADY_EXISTS'; END IF;
 INSERT INTO public.amber_characters(user_id,character_name,save_data,updated_at)
 VALUES(u,name_text,s,now())
 ON CONFLICT(user_id) DO UPDATE SET character_name=EXCLUDED.character_name,
 save_data=EXCLUDED.save_data,updated_at=now()
 WHERE coalesce(public.amber_characters.save_data->>'character_created','false')<>'true';
 IF NOT FOUND THEN RAISE EXCEPTION 'CHARACTER_ALREADY_EXISTS'; END IF;
 -- Create the new private canonical row; no client can write to it.
 INSERT INTO private.amber_v276_player_state(user_id,map_id,level,experience,gold,gems,stat_points,skill_points,stats,source_status)
 VALUES(u,'school',1,0,1000,100000,0,0,s->'stats','server_verified')
 ON CONFLICT(user_id) DO NOTHING;
 -- V299_NEW_PLAYER_GIFT: server-owned, exactly once for each created character.
 INSERT INTO private.amber_v299_starter_receipts(user_id,character_name,grant_kind,gems_added,pot_hp_added,pot_mp_added)
 VALUES(u,name_text,'character_creation',100000,1000,1000)
 ON CONFLICT(user_id) DO NOTHING;
END $function$;

CREATE OR REPLACE FUNCTION public.amber_v277_economy(p_action text, p_args jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 u uuid:=(SELECT auth.uid()); s jsonb; gold bigint; gems bigint; mats jsonb; bag jsonb; gear jsonb; shop jsonb; owned jsonb;
 action_name text:=coalesce(p_action,''); key text; sku text; item_id text; slot text; job text; st text; skill_id text;
 i jsonb; idx int; n int; levels int[]:=ARRAY[1,10,20,30,40,50,60,70,80,90,100];
 lv int; pts int; skpts int; enh int; cost bigint; stones int; stone_key text; chance int; succeeded boolean;
 days int; add_obj jsonb; stats jsonb; reward jsonb:='{}'::jsonb;
 sk private.amber_v276_skills%ROWTYPE;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'V277_LOGIN_REQUIRED'; END IF;
 IF length(action_name)>40 OR p_args IS NULL OR jsonb_typeof(p_args)<>'object' OR octet_length(p_args::text)>1024 THEN RAISE EXCEPTION 'V277_BAD_ACTION'; END IF;
 
 IF NOT EXISTS(SELECT 1 FROM private.amber_v277_bootstrap WHERE user_id=u) THEN
   PERFORM public.amber_v277_bootstrap();
 END IF;
 SELECT save_data INTO s FROM public.amber_characters WHERE user_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'V277_NO_CHARACTER'; END IF;
 gold:=coalesce((s->>'gold')::bigint,0);gems:=coalesce((s->>'gems')::bigint,0); lv:=coalesce((s->>'lv')::int,1);
 pts:=coalesce((s->>'points')::int,0);skpts:=coalesce((s->>'skillPoints')::int,0);
 bag:=coalesce(s->'bag','[]'::jsonb);gear:=coalesce(s->'gear','[]'::jsonb);
 mats:=coalesce(s->'mats','{"ga":0,"gw":0}'::jsonb);shop:=coalesce(s->'shop20','{}'::jsonb);owned:=coalesce(shop->'owned','[]'::jsonb);
 IF gold<0 OR gold>2000000000 OR gems<0 OR gems>2000000000 OR lv NOT BETWEEN 1 AND 100 OR pts<0 OR skpts<0
 OR jsonb_typeof(bag)<>'array' OR jsonb_typeof(gear)<>'array' OR jsonb_typeof(owned)<>'array' THEN RAISE EXCEPTION 'V277_BAD_LEGACY_SAVE'; END IF;
 IF action_name='buy_potion' THEN
    st:=p_args->>'type';
    IF st IS NULL OR st NOT IN ('hp','mp') OR gold<50 THEN RAISE EXCEPTION 'V277_CANNOT_BUY_POTION'; END IF;
    key:=CASE WHEN st='hp' THEN 'potHP' ELSE 'potMP' END;
    n:=coalesce((s->>key)::int,0)+1;IF n>999999 THEN RAISE EXCEPTION 'V277_POTION_CAP'; END IF;
    gold:=gold-50;s:=jsonb_set(s,ARRAY[key],to_jsonb(n),true);
 ELSIF action_name='buy_shop' THEN
    sku:=p_args->>'sku';
    CASE sku
       WHEN 'sun_1' THEN cost:=250;days:=1;
       WHEN 'sun_3' THEN cost:=600;days:=3;
       WHEN 'sun_7' THEN cost:=1200;days:=7;
       WHEN 'moon_1' THEN cost:=600;days:=1;
       WHEN 'moon_3' THEN cost:=1600;days:=3;
       WHEN 'moon_7' THEN cost:=3500;days:=7;
       WHEN 'reset_skill' THEN cost:=500;days:=0;
       WHEN 'reset_stat' THEN cost:=500;days:=0;
       ELSE RAISE EXCEPTION 'V277_UNKNOWN_SKU';
    END CASE;
    IF gems<cost OR jsonb_array_length(owned)>=120 THEN RAISE EXCEPTION 'V277_NO_GEMS_OR_FULL'; END IF;
    gems:=gems-cost;
    item_id:='it_'||replace(gen_random_uuid()::text,'-','');
    add_obj:=jsonb_build_object('id',item_id,'sku',sku,'at',clock_timestamp(),'expiresAt',
       CASE WHEN days>0 THEN to_jsonb(clock_timestamp()+make_interval(days=>days)) ELSE 'null'::jsonb END);
    owned:=owned||jsonb_build_array(add_obj);
    shop:=jsonb_set(shop,'{owned}',owned,true);s:=jsonb_set(s,'{shop20}',shop,true);
    reward:=jsonb_build_object('item_id',item_id,'sku',sku);
 ELSIF action_name='equip_wing' THEN
    item_id:=nullif(p_args->>'id','');
    IF item_id IS NOT NULL THEN
      SELECT value INTO i FROM jsonb_array_elements(owned) x(value) WHERE value->>'id'=item_id LIMIT 1;
      IF i IS NULL OR i->>'sku' NOT IN ('sun_1','sun_3','sun_7','moon_1','moon_3','moon_7') OR (i->>'expiresAt')::timestamptz<=clock_timestamp() THEN RAISE EXCEPTION 'V277_WING_NOT_OWNED'; END IF;
      IF (i->>'sku' LIKE 'sun_%' AND lv>50) OR (i->>'sku' LIKE 'moon_%' AND lv<50) THEN RAISE EXCEPTION 'V277_WRONG_WING_LEVEL'; END IF;
    END IF;
    shop:=jsonb_set(shop,'{equipped}',CASE WHEN item_id IS NULL THEN 'null'::jsonb ELSE to_jsonb(item_id) END,true);s:=jsonb_set(s,'{shop20}',shop,true);
 ELSIF action_name='enhance' THEN
    item_id:=p_args->>'id';
    SELECT ord::int,value INTO idx,i FROM jsonb_array_elements(gear) WITH ORDINALITY x(value,ord) WHERE value->>'id'=item_id LIMIT 1;
    IF i IS NULL THEN RAISE EXCEPTION 'V277_GEAR_NOT_FOUND'; END IF;
    enh:=coalesce((i->>'enh')::int,0);IF enh NOT BETWEEN 0 AND 9 THEN RAISE EXCEPTION 'V277_ENH_LIMIT'; END IF;
    stone_key:=CASE WHEN i->>'slot'='W' THEN 'gw' ELSE 'ga' END;stones:=CASE WHEN enh>=6 THEN 2 ELSE 1 END;cost:=300*(enh+1)*(enh+1);
    IF coalesce((mats->>stone_key)::int,0)<stones OR gold<cost THEN RAISE EXCEPTION 'V277_ENH_RESOURCES_LOW'; END IF;
    chance:=(ARRAY[100,100,100,90,80,65,50,40,30,20])[enh+1];
    -- V290: the server alone validates/consumes enhancement ores, then rolls.
    st:=nullif(p_args->>'ore','');
    IF st IS NOT NULL THEN
      IF st NOT IN ('ore_fire','ore_ice','ore_prism') OR
         (st='ore_fire' AND i->>'slot'<>'W') OR
         (st='ore_ice' AND i->>'slot'='W') THEN
        RAISE EXCEPTION 'V290_INVALID_ENHANCEMENT_ORE'; END IF;
      IF coalesce((mats->>st)::int,0)<1 THEN RAISE EXCEPTION 'V290_ORE_NOT_OWNED'; END IF;
      IF chance<100 THEN
        mats:=pg_catalog.jsonb_set(mats,ARRAY[st],pg_catalog.to_jsonb((mats->>st)::int-1),true);
        chance:=least(95,chance+CASE WHEN st='ore_prism' THEN 10 ELSE 5 END);
      ELSE st:=NULL; END IF;
    END IF;
    succeeded:=random()*100<chance;
    n:=CASE WHEN succeeded THEN enh+1 WHEN enh>=7 THEN enh-1 ELSE enh END;
    mats:=jsonb_set(mats,ARRAY[stone_key],to_jsonb((mats->>stone_key)::int-stones),true);
    gear:=jsonb_set(gear,ARRAY[(idx-1)::text,'enh'],to_jsonb(n),false);gold:=gold-cost;
    s:=jsonb_set(s,'{mats}',mats,true);s:=jsonb_set(s,'{gear}',gear,true);
    reward:=jsonb_build_object('success',succeeded,'old_level',enh,'new_level',n);
 ELSIF action_name='npc_gear' THEN
    job:=p_args->>'job';slot:=p_args->>'slot';n:=coalesce((p_args->>'level')::int,0);
    IF job IS NULL OR slot IS NULL OR job NOT IN ('ดาบ','หมัด','ธนู','จอมเวท') OR slot NOT IN ('W','S','G','B') OR NOT n=ANY(levels) THEN RAISE EXCEPTION 'V277_NPC_INVALID_ITEM'; END IF;
    IF jsonb_array_length(gear)>=40 THEN RAISE EXCEPTION 'V277_GEAR_FULL'; END IF;
    cost:=round(40+n*n*(CASE slot WHEN 'W' THEN 4.2 WHEN 'S' THEN 3.5 ELSE 2.3 END))::bigint;
    IF gold<cost THEN RAISE EXCEPTION 'V277_GOLD_LOW'; END IF;
    item_id:='npc_'||replace(gen_random_uuid()::text,'-','');
    add_obj:=jsonb_build_object('id',item_id,'slot',slot,'cls',job,'name',job||'ฝึกหัด Lv.'||n,
      'rar',0,'lv',n,'req',n,
      'base',CASE slot WHEN 'W' THEN jsonb_build_object('ATK',round(8+n*1.25)::int)
       WHEN 'S' THEN jsonb_build_object('DEF',round(2+n*0.62)::int,'HP',round(12+n*2)::int)
       WHEN 'G' THEN jsonb_build_object('ATK',round(2+n*0.27)::int)
       ELSE jsonb_build_object('DEF',round(1+n*0.3)::int,'AGI',round(n/45.0)::int) END,
       'opts','[]'::jsonb,'enh',0,'npc',true);
    gear:=gear||jsonb_build_array(add_obj);gold:=gold-cost;
    s:=jsonb_set(s,'{gear}',gear,true);reward:=jsonb_build_object('item_id',item_id,'name',add_obj->>'name');
 ELSIF action_name='allocate_stat' THEN
    st:=p_args->>'stat';
    IF st IS NULL OR st NOT IN ('STR','DEX','INT','VIT','AGI','LUK') OR pts<1 THEN RAISE EXCEPTION 'V277_STAT_INVALID'; END IF;
    stats:=coalesce(s->'stats','{}'::jsonb);n:=coalesce((stats->>st)::int,0)+1;
    IF n>10000 THEN RAISE EXCEPTION 'V277_STAT_CAP'; END IF;
    stats:=jsonb_set(stats,ARRAY[st],to_jsonb(n),true);
    s:=jsonb_set(s,'{stats}',stats,true);s:=jsonb_set(s,'{points}',to_jsonb(pts-1),true);
 ELSIF action_name='change_job' THEN
    job:=p_args->>'job';
    IF job IS NULL OR lv<10 OR s->>'job' IS DISTINCT FROM 'นักผจญภัย' OR job NOT IN ('ดาบ','หมัด','ธนู','จอมเวท') THEN RAISE EXCEPTION 'V277_JOB_INVALID'; END IF;
    s:=jsonb_set(s,'{job}',to_jsonb(job),true);
 ELSIF action_name='learn_skill' THEN
    skill_id:=p_args->>'skill_id';SELECT * INTO sk FROM private.amber_v276_skills WHERE sk.skill_id=skill_id;
    IF NOT FOUND OR lv<sk.required_level OR skpts<1 OR s->>'job' IS DISTINCT FROM sk.job THEN RAISE EXCEPTION 'V277_SKILL_INVALID'; END IF;
    st:=CASE WHEN sk.path='POWER' THEN 'STR' ELSE sk.path END;
    IF coalesce((s->'stats'->>st)::int,0)<sk.required_stat OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(coalesce(s->'learned','[]'::jsonb)) q(value) WHERE q.value=skill_id) THEN RAISE EXCEPTION 'V277_SKILL_NOT_ALLOWED'; END IF;
    s:=jsonb_set(s,'{learned}',coalesce(s->'learned','[]'::jsonb)||to_jsonb(skill_id),true);
    s:=jsonb_set(s,'{skillPoints}',to_jsonb(skpts-1),true);
 ELSE
    RAISE EXCEPTION 'V277_UNKNOWN_ACTION';
 END IF;
 s:=jsonb_set(s,'{gold}',to_jsonb(gold),true);s:=jsonb_set(s,'{gems}',to_jsonb(gems),true);
 UPDATE public.amber_characters SET save_data=s,updated_at=clock_timestamp() WHERE user_id=u;
 UPDATE private.amber_v276_player_state SET gold=(s->>'gold')::bigint,gems=(s->>'gems')::bigint,
   level=coalesce((s->>'lv')::int,1),experience=coalesce((s->>'xp')::bigint,0),
   stat_points=coalesce((s->>'points')::int,0),skill_points=coalesce((s->>'skillPoints')::int,0),
   stats=coalesce(s->'stats','{}'::jsonb),version=version+1,updated_at=clock_timestamp() WHERE user_id=u;
 /* V279_MISSION_ENHANCE_EVIDENCE: record server validated spend */ IF p_action='enhance' THEN INSERT INTO private.amber_v279_mission_actions(user_id,action_kind,detail) VALUES (u,'enhance',jsonb_build_object('item_id',item_id,'result',reward)); END IF; RETURN jsonb_build_object('ok',true,'save',s,'details',reward);
END $function$;

CREATE OR REPLACE FUNCTION public.amber_v283_auto_attack(p_monster_id text, p_skill_id text DEFAULT NULL::text, p_auto_potion boolean DEFAULT false, p_hp_threshold integer DEFAULT 50, p_mp_threshold integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 u uuid:=(SELECT auth.uid());
 s jsonb; lv int; vit int; int_stat int; rb int;
 hp int; mp int; hp_max int; mp_max int;
 hp_stock int; mp_stock int; used_hp boolean:=false;used_mp boolean:=false;
 amount int; a jsonb; v299_vitals jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'V283_LOGIN_REQUIRED'; END IF;
 IF p_hp_threshold IS NULL OR p_mp_threshold IS NULL OR p_auto_potion IS NULL OR p_hp_threshold NOT BETWEEN 1 AND 99 OR p_mp_threshold NOT BETWEEN 1 AND 99 THEN
   RAISE EXCEPTION 'V283_THRESHOLD_INVALID';
 END IF;
 PERFORM public.amber_v277_bootstrap();
 SELECT save_data INTO s FROM public.amber_characters WHERE user_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'V283_CHARACTER_NOT_FOUND'; END IF;
 -- V298_AUTO_BOSS_PRECHECK: do not consume potions while the boss is dead.
 IF EXISTS(SELECT 1 FROM private.amber_v298_map_boss_spawns b
  WHERE b.monster_id=p_monster_id AND b.available_at>clock_timestamp()) THEN
  RETURN jsonb_build_object('ok',true,'save',s,'monster_id',p_monster_id,
   'monster_hp',0,'damage',0,'crit',false,'hit',false,'killed',false,
   'reward_exp',0,'reward_gold',0,'boss_respawning',true,
   'respawn_at',(SELECT available_at FROM private.amber_v298_map_boss_spawns WHERE monster_id=p_monster_id),
   'auto_hp_used',false,'auto_mp_used',false);
 END IF;
 lv:=COALESCE((s->>'lv')::int,1);vit:=COALESCE((s#>>'{stats,VIT}')::int,10);
 int_stat:=COALESCE((s#>>'{stats,INT}')::int,5);
 rb:=LEAST(10,GREATEST(0,COALESCE((s#>>'{v25,rebirth}')::int,0)));
 hp:=COALESCE((s->>'hp')::int,0);mp:=COALESCE((s->>'mp')::int,0);
 hp_stock:=COALESCE((s->>'potHP')::int,0);mp_stock:=COALESCE((s->>'potMP')::int,0);
 IF lv NOT BETWEEN 1 AND 100 OR vit NOT BETWEEN 0 AND 10000 OR int_stat NOT BETWEEN 0 AND 10000
 OR hp_stock NOT BETWEEN 0 AND 999999 OR mp_stock NOT BETWEEN 0 AND 999999
 OR hp<0 OR mp<0 THEN RAISE EXCEPTION 'V283_STATE_INVALID'; END IF;
 -- Server-only HP/MP thresholds. Client cannot choose actual HP, potions or healing amount.
 -- V299_AUTO_CANONICAL_VITALS: use identical ceilings for manual and AUTO potion.
 v299_vitals:=private.amber_v300_max_vitals(u,s);
 hp_max:=(v299_vitals->>'max_hp')::integer;
 mp_max:=(v299_vitals->>'max_mp')::integer;
 IF p_auto_potion IS TRUE AND hp>0 THEN
   IF hp_stock>0 AND hp::numeric*100<=hp_max::numeric*p_hp_threshold AND hp<hp_max THEN
     amount:=GREATEST(130,round(hp_max*0.55)::int);
     hp:=LEAST(hp_max,hp+amount);hp_stock:=hp_stock-1;used_hp:=true;
     s:=jsonb_set(jsonb_set(s,'{hp}',to_jsonb(hp),true),'{potHP}',to_jsonb(hp_stock),true);
   END IF;
   IF mp_stock>0 AND mp::numeric*100<=mp_max::numeric*p_mp_threshold AND mp<mp_max THEN
     amount:=GREATEST(70,round(mp_max*0.60)::int);
     mp:=LEAST(mp_max,mp+amount);mp_stock:=mp_stock-1;used_mp:=true;
     s:=jsonb_set(jsonb_set(s,'{mp}',to_jsonb(mp),true),'{potMP}',to_jsonb(mp_stock),true);
   END IF;
   IF used_hp OR used_mp THEN
      UPDATE public.amber_characters SET save_data=s,updated_at=clock_timestamp() WHERE user_id=u;
   END IF;
 END IF;
 a:=public.amber_v277_attack(p_monster_id,p_skill_id);
 RETURN a || jsonb_build_object('auto_hp_used',used_hp,'auto_mp_used',used_mp);
END $function$;


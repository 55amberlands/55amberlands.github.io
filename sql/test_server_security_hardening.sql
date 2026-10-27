BEGIN;

DO $tests$
DECLARE u uuid; before_hash text; after_hash text; result jsonb; msg text; t record;
BEGIN
 SELECT user_id INTO u FROM public.amber_characters WHERE jsonb_typeof(save_data)='object' LIMIT 1;
 IF u IS NULL THEN RAISE EXCEPTION 'Test requires existing character'; END IF;
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 SELECT md5(save_data::text) INTO before_hash FROM public.amber_characters WHERE user_id=u;
 BEGIN
 PERFORM public.amber_v277_economy('buy_potion','{"type":null}'::jsonb);
 RAISE EXCEPTION 'TEST_FAILED_NULL_POTION';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'V277_CANNOT_BUY_POTION' THEN RAISE; END IF; END;
 BEGIN
 PERFORM public.amber_v277_economy('allocate_stat','{"stat":null}'::jsonb);
 RAISE EXCEPTION 'TEST_FAILED_NULL_STAT';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'V277_STAT_INVALID' THEN RAISE; END IF; END;
 BEGIN
 PERFORM public.amber_market_post('potion','hp',NULL,100);
 RAISE EXCEPTION 'TEST_FAILED_NULL_POST';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'Invalid quantity or price' THEN RAISE; END IF; END;
 BEGIN
 PERFORM public.amber_market_buy(1,NULL);
 RAISE EXCEPTION 'TEST_FAILED_NULL_BUY';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'Invalid quantity' THEN RAISE; END IF; END;
 BEGIN
 PERFORM public.amber_v283_auto_attack('school_0',NULL,true,NULL,50);
 RAISE EXCEPTION 'TEST_FAILED_NULL_THRESHOLD';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM <> 'V283_THRESHOLD_INVALID' THEN RAISE; END IF; END;
 SELECT md5(save_data::text) INTO after_hash FROM public.amber_characters WHERE user_id=u;
 IF before_hash IS DISTINCT FROM after_hash THEN RAISE EXCEPTION 'TEST_FAILED_SAVE_CHANGED'; END IF;
 FOR t IN SELECT n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','private') AND c.relkind IN ('r','p') AND c.relname LIKE 'amber_%' LOOP
 IF has_table_privilege('anon',format('%I.%I',t.nspname,t.relname),'TRUNCATE') OR has_table_privilege('authenticated',format('%I.%I',t.nspname,t.relname),'TRUNCATE') THEN RAISE EXCEPTION 'TEST_FAILED_TRUNCATE'; END IF;
 END LOOP;
 -- Valid client call under the real API role, rolled back by the outer transaction.
 SET LOCAL ROLE authenticated;
 PERFORM public.amber_v277_visual_save('{}'::jsonb);
 RESET ROLE;
END $tests$;

ROLLBACK;


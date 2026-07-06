CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'viewer'
);


--
-- Name: client_size; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.client_size AS ENUM (
    'small',
    'medium',
    'enterprise'
);


--
-- Name: currency_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.currency_type AS ENUM (
    'INR',
    'USD'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue',
    'cancelled'
);


--
-- Name: pricing_model; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pricing_model AS ENUM (
    'fixed',
    'monthly',
    'hourly',
    'custom',
    'per_day',
    'package'
);


--
-- Name: quotation_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quotation_status AS ENUM (
    'draft',
    'sent',
    'accepted',
    'declined',
    'expired'
);


--
-- Name: terms_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.terms_category AS ENUM (
    'payment',
    'delivery',
    'revision',
    'cancellation',
    'ownership',
    'confidentiality',
    'general'
);


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  sequence_num INT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INT)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'I' || year_month || '%';
  
  new_number := 'I' || year_month || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;


--
-- Name: generate_quotation_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_quotation_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  sequence_num INT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 5) AS INT)), 0) + 1
  INTO sequence_num
  FROM public.quotations
  WHERE quotation_number LIKE 'Q' || year_month || '%';
  
  new_number := 'Q' || year_month || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;


--
-- Name: generate_receipt_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_receipt_number() RETURNS text
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  sequence_num INT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 5) AS INT)), 0) + 1
  INTO sequence_num
  FROM public.receipts
  WHERE receipt_number LIKE 'R' || year_month || '%';
  
  new_number := 'R' || year_month || LPAD(sequence_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: analytics_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    period_type text NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    total_quotations integer DEFAULT 0 NOT NULL,
    accepted_quotations integer DEFAULT 0 NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0 NOT NULL,
    service_breakdown jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brand_kit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brand_kit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    logo_url text,
    company_name text DEFAULT 'Your Company'::text NOT NULL,
    primary_color text DEFAULT '#000000'::text NOT NULL,
    secondary_color text DEFAULT '#ffffff'::text NOT NULL,
    accent_color text DEFAULT '#666666'::text NOT NULL,
    font_heading text DEFAULT 'Montserrat'::text NOT NULL,
    font_body text DEFAULT 'Inter'::text NOT NULL,
    email text,
    phone text,
    address text,
    website text,
    default_currency public.currency_type DEFAULT 'INR'::public.currency_type NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    business_name text,
    size public.client_size DEFAULT 'small'::public.client_size NOT NULL,
    industry text,
    custom_industry text,
    location text,
    phone text,
    notes text,
    is_deleted boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    quotation_id uuid,
    client_id uuid,
    currency public.currency_type DEFAULT 'INR'::public.currency_type NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    amount_paid numeric(12,2) DEFAULT 0 NOT NULL,
    amount_due numeric(12,2) DEFAULT 0 NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    due_date date,
    notes text,
    share_token text DEFAULT (gen_random_uuid())::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotation_service_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_service_addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_service_id uuid NOT NULL,
    addon_id uuid,
    name text NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotation_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_id uuid NOT NULL,
    service_id uuid,
    service_name text NOT NULL,
    description text,
    pricing_model public.pricing_model DEFAULT 'fixed'::public.pricing_model NOT NULL,
    quantity numeric(10,2) DEFAULT 1 NOT NULL,
    unit_price numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    is_included boolean DEFAULT true NOT NULL,
    custom_notes text,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotation_terms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotation_terms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_id uuid NOT NULL,
    terms_clause_id uuid,
    title text NOT NULL,
    content text NOT NULL,
    is_custom boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    quotation_number text NOT NULL,
    client_id uuid,
    title text NOT NULL,
    introduction text,
    scope_of_work text,
    currency public.currency_type DEFAULT 'INR'::public.currency_type NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount numeric(12,2) DEFAULT 0 NOT NULL,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(12,2) DEFAULT 0 NOT NULL,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    valid_until date,
    status public.quotation_status DEFAULT 'draft'::public.quotation_status NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    template_name text,
    notes text,
    share_token text DEFAULT (gen_random_uuid())::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    receipt_number text NOT NULL,
    invoice_id uuid,
    client_id uuid,
    currency public.currency_type DEFAULT 'INR'::public.currency_type NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    payment_method text,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    share_token text DEFAULT (gen_random_uuid())::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    name text NOT NULL,
    price numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    pricing_model public.pricing_model DEFAULT 'fixed'::public.pricing_model NOT NULL,
    base_price numeric(12,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: terms_clauses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.terms_clauses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    category public.terms_category DEFAULT 'general'::public.terms_category NOT NULL,
    applicable_service_types text[],
    applicable_payment_models text[],
    applicable_client_sizes text[],
    is_default boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'admin'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (id);


--
-- Name: brand_kit brand_kit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brand_kit
    ADD CONSTRAINT brand_kit_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_share_token_key UNIQUE (share_token);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quotation_service_addons quotation_service_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_service_addons
    ADD CONSTRAINT quotation_service_addons_pkey PRIMARY KEY (id);


--
-- Name: quotation_services quotation_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_services
    ADD CONSTRAINT quotation_services_pkey PRIMARY KEY (id);


--
-- Name: quotation_terms quotation_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_terms
    ADD CONSTRAINT quotation_terms_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number);


--
-- Name: quotations quotations_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_share_token_key UNIQUE (share_token);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_receipt_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_receipt_number_key UNIQUE (receipt_number);


--
-- Name: receipts receipts_share_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_share_token_key UNIQUE (share_token);


--
-- Name: service_addons service_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_addons
    ADD CONSTRAINT service_addons_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: terms_clauses terms_clauses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.terms_clauses
    ADD CONSTRAINT terms_clauses_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_clients_email_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_clients_email_unique ON public.clients USING btree (email) WHERE ((email IS NOT NULL) AND (is_deleted = false));


--
-- Name: analytics_cache update_analytics_cache_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_analytics_cache_updated_at BEFORE UPDATE ON public.analytics_cache FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_kit update_brand_kit_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_brand_kit_updated_at BEFORE UPDATE ON public.brand_kit FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quotations update_quotations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services update_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: terms_clauses update_terms_clauses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_terms_clauses_updated_at BEFORE UPDATE ON public.terms_clauses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quotation_service_addons quotation_service_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_service_addons
    ADD CONSTRAINT quotation_service_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.service_addons(id) ON DELETE SET NULL;


--
-- Name: quotation_service_addons quotation_service_addons_quotation_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_service_addons
    ADD CONSTRAINT quotation_service_addons_quotation_service_id_fkey FOREIGN KEY (quotation_service_id) REFERENCES public.quotation_services(id) ON DELETE CASCADE;


--
-- Name: quotation_services quotation_services_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_services
    ADD CONSTRAINT quotation_services_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;


--
-- Name: quotation_services quotation_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_services
    ADD CONSTRAINT quotation_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;


--
-- Name: quotation_terms quotation_terms_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_terms
    ADD CONSTRAINT quotation_terms_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;


--
-- Name: quotation_terms quotation_terms_terms_clause_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotation_terms
    ADD CONSTRAINT quotation_terms_terms_clause_id_fkey FOREIGN KEY (terms_clause_id) REFERENCES public.terms_clauses(id) ON DELETE SET NULL;


--
-- Name: quotations quotations_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: receipts receipts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: receipts receipts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: service_addons service_addons_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_addons
    ADD CONSTRAINT service_addons_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clients Authenticated users can delete clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);


--
-- Name: invoices Authenticated users can delete invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (true);


--
-- Name: quotation_service_addons Authenticated users can delete quotation_service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete quotation_service_addons" ON public.quotation_service_addons FOR DELETE TO authenticated USING (true);


--
-- Name: quotation_services Authenticated users can delete quotation_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete quotation_services" ON public.quotation_services FOR DELETE TO authenticated USING (true);


--
-- Name: quotation_terms Authenticated users can delete quotation_terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete quotation_terms" ON public.quotation_terms FOR DELETE TO authenticated USING (true);


--
-- Name: quotations Authenticated users can delete quotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete quotations" ON public.quotations FOR DELETE TO authenticated USING (true);


--
-- Name: receipts Authenticated users can delete receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete receipts" ON public.receipts FOR DELETE TO authenticated USING (true);


--
-- Name: service_addons Authenticated users can delete service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete service_addons" ON public.service_addons FOR DELETE TO authenticated USING (true);


--
-- Name: services Authenticated users can delete services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete services" ON public.services FOR DELETE TO authenticated USING (true);


--
-- Name: terms_clauses Authenticated users can delete terms_clauses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete terms_clauses" ON public.terms_clauses FOR DELETE TO authenticated USING (true);


--
-- Name: brand_kit Authenticated users can insert brand_kit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert brand_kit" ON public.brand_kit FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: clients Authenticated users can insert clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: invoices Authenticated users can insert invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: quotation_service_addons Authenticated users can insert quotation_service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert quotation_service_addons" ON public.quotation_service_addons FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: quotation_services Authenticated users can insert quotation_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert quotation_services" ON public.quotation_services FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: quotation_terms Authenticated users can insert quotation_terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert quotation_terms" ON public.quotation_terms FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: quotations Authenticated users can insert quotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: receipts Authenticated users can insert receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: service_addons Authenticated users can insert service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert service_addons" ON public.service_addons FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: services Authenticated users can insert services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: terms_clauses Authenticated users can insert terms_clauses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert terms_clauses" ON public.terms_clauses FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: analytics_cache Authenticated users can manage analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage analytics" ON public.analytics_cache TO authenticated USING (true);


--
-- Name: brand_kit Authenticated users can update brand_kit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update brand_kit" ON public.brand_kit FOR UPDATE TO authenticated USING (true);


--
-- Name: clients Authenticated users can update clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);


--
-- Name: invoices Authenticated users can update invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (true);


--
-- Name: quotation_service_addons Authenticated users can update quotation_service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update quotation_service_addons" ON public.quotation_service_addons FOR UPDATE TO authenticated USING (true);


--
-- Name: quotation_services Authenticated users can update quotation_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update quotation_services" ON public.quotation_services FOR UPDATE TO authenticated USING (true);


--
-- Name: quotation_terms Authenticated users can update quotation_terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update quotation_terms" ON public.quotation_terms FOR UPDATE TO authenticated USING (true);


--
-- Name: quotations Authenticated users can update quotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (true);


--
-- Name: receipts Authenticated users can update receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update receipts" ON public.receipts FOR UPDATE TO authenticated USING (true);


--
-- Name: service_addons Authenticated users can update service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update service_addons" ON public.service_addons FOR UPDATE TO authenticated USING (true);


--
-- Name: services Authenticated users can update services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update services" ON public.services FOR UPDATE TO authenticated USING (true);


--
-- Name: terms_clauses Authenticated users can update terms_clauses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update terms_clauses" ON public.terms_clauses FOR UPDATE TO authenticated USING (true);


--
-- Name: analytics_cache Authenticated users can view analytics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view analytics" ON public.analytics_cache FOR SELECT TO authenticated USING (true);


--
-- Name: brand_kit Authenticated users can view brand_kit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view brand_kit" ON public.brand_kit FOR SELECT TO authenticated USING (true);


--
-- Name: clients Authenticated users can view clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);


--
-- Name: invoices Authenticated users can view invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view invoices" ON public.invoices FOR SELECT TO authenticated USING (true);


--
-- Name: quotation_service_addons Authenticated users can view quotation_service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view quotation_service_addons" ON public.quotation_service_addons FOR SELECT TO authenticated USING (true);


--
-- Name: quotation_services Authenticated users can view quotation_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view quotation_services" ON public.quotation_services FOR SELECT TO authenticated USING (true);


--
-- Name: quotation_terms Authenticated users can view quotation_terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view quotation_terms" ON public.quotation_terms FOR SELECT TO authenticated USING (true);


--
-- Name: quotations Authenticated users can view quotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view quotations" ON public.quotations FOR SELECT TO authenticated USING (true);


--
-- Name: receipts Authenticated users can view receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view receipts" ON public.receipts FOR SELECT TO authenticated USING (true);


--
-- Name: service_addons Authenticated users can view service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view service_addons" ON public.service_addons FOR SELECT TO authenticated USING (true);


--
-- Name: services Authenticated users can view services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view services" ON public.services FOR SELECT TO authenticated USING (true);


--
-- Name: terms_clauses Authenticated users can view terms_clauses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view terms_clauses" ON public.terms_clauses FOR SELECT TO authenticated USING (true);


--
-- Name: invoices Public can view shared invoices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared invoices" ON public.invoices FOR SELECT TO anon USING ((share_token IS NOT NULL));


--
-- Name: quotation_service_addons Public can view shared quotation_service_addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared quotation_service_addons" ON public.quotation_service_addons FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM (public.quotation_services qs
     JOIN public.quotations q ON ((q.id = qs.quotation_id)))
  WHERE ((qs.id = quotation_service_addons.quotation_service_id) AND (q.share_token IS NOT NULL)))));


--
-- Name: quotation_services Public can view shared quotation_services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared quotation_services" ON public.quotation_services FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.quotations
  WHERE ((quotations.id = quotation_services.quotation_id) AND (quotations.share_token IS NOT NULL)))));


--
-- Name: quotation_terms Public can view shared quotation_terms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared quotation_terms" ON public.quotation_terms FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.quotations
  WHERE ((quotations.id = quotation_terms.quotation_id) AND (quotations.share_token IS NOT NULL)))));


--
-- Name: quotations Public can view shared quotations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared quotations" ON public.quotations FOR SELECT TO anon USING ((share_token IS NOT NULL));


--
-- Name: receipts Public can view shared receipts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view shared receipts" ON public.receipts FOR SELECT TO anon USING ((share_token IS NOT NULL));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analytics_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: brand_kit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brand_kit ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: invoices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quotation_service_addons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotation_service_addons ENABLE ROW LEVEL SECURITY;

--
-- Name: quotation_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotation_services ENABLE ROW LEVEL SECURITY;

--
-- Name: quotation_terms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotation_terms ENABLE ROW LEVEL SECURITY;

--
-- Name: quotations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

--
-- Name: receipts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

--
-- Name: service_addons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

--
-- Name: services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

--
-- Name: terms_clauses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.terms_clauses ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



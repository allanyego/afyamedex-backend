--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-0ubuntu0.18.04.1)
-- Dumped by pg_dump version 11.6 (Ubuntu 11.6-1.pgdg18.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: conditions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conditions (
    name character varying NOT NULL,
    description text NOT NULL,
    symptoms text NOT NULL,
    remedies text NOT NULL,
    disabled boolean NOT NULL,
    media_kind character varying,
    media_file character varying,
    created_at timestamp with time zone NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.conditions OWNER TO postgres;

--
-- Name: conditions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conditions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conditions_id_seq OWNER TO postgres;

--
-- Name: conditions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conditions_id_seq OWNED BY public.conditions.id;


--
-- Name: conditions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conditions ALTER COLUMN id SET DEFAULT nextval('public.conditions_id_seq'::regclass);


--
-- Data for Name: conditions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conditions (name, description, symptoms, remedies, disabled, media_kind, media_file, created_at, id) FROM stdin;
adhd	some serious condition, I think.	uno\ndos\ntre	uno\ndos\ntre	f	\N	\N	2021-03-01 13:33:39.013+03	3
depression	A very bad condition.	uno\ndos	tre\nquatro	f	\N	\N	2021-03-01 13:50:01.579+03	4
depression iv	another one	uno\ndos	tre\nquatro	t	image	6.jpg	2021-03-01 14:05:17.433+03	6
depression ii	another one	uno\ndos	tre\nquatro	t	\N	\N	2021-03-01 14:00:05.124+03	5
\.


--
-- Name: conditions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conditions_id_seq', 6, true);


--
-- Name: conditions conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conditions
    ADD CONSTRAINT conditions_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--


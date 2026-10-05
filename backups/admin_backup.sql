--
-- PostgreSQL database dump
--

\restrict AJ5eRp9m0B0zQzLJ3r9mXkcWbutDJ1bh1jdwBUgZPT59cYblIz8EMGyn1CIAShc

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

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
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (admin_id, name, email, phone, password_hash, gym_id, role) FROM stdin;
4	Wamisha	wa@gmail.com	0988675466	32768:8:1$ieRUmeD45Oc7Zj58$2d4fd5f67b0d72cf05328b5340267410dad1d49ea81bcf95840c0bc9d82a64c1588354652f70337fdc9621787fa399694e82f0f0fce79812355c4c8bde05265a	1	admin
1	Wamisha	sahiluwamisha@gmail.com	0988675466	scrypt:32768:8:1$grHUQl4hohQVaPf2$ec7cc2fe456f19eefd2de1f23927432467b250c475efce569b69ae1e463d6dc654c030642a63bcb9ee13e16b2f58b1c6af81b9ab315a05aa410304b34eeef175	1	admin
\.


--
-- PostgreSQL database dump complete
--

\unrestrict AJ5eRp9m0B0zQzLJ3r9mXkcWbutDJ1bh1jdwBUgZPT59cYblIz8EMGyn1CIAShc


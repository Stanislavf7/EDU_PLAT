PGDMP           
    
        }            plusiC    16.2    16.2 %               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    73721    plusiC    DATABASE     |   CREATE DATABASE "plusiC" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE "plusiC";
                postgres    false            �            1259    73745    courses    TABLE     a  CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    difficulty character varying(50),
    creator_id integer,
    json_path character varying(255) NOT NULL,
    is_published boolean DEFAULT false,
    created_at date DEFAULT CURRENT_DATE,
    version integer DEFAULT 1 NOT NULL
);
    DROP TABLE public.courses;
       public         heap    postgres    false            �            1259    73744    courses_id_seq    SEQUENCE     �   CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 %   DROP SEQUENCE public.courses_id_seq;
       public          postgres    false    218                       0    0    courses_id_seq    SEQUENCE OWNED BY     A   ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;
          public          postgres    false    217            �            1259    73836    notifications    TABLE       CREATE TABLE public.notifications (
    id integer NOT NULL,
    type character varying(50),
    message text,
    user_id integer,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);
 !   DROP TABLE public.notifications;
       public         heap    postgres    false            �            1259    73835    notifications_id_seq    SEQUENCE     �   CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.notifications_id_seq;
       public          postgres    false    222                        0    0    notifications_id_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
          public          postgres    false    221            �            1259    73800    pending_courses    TABLE     �  CREATE TABLE public.pending_courses (
    id character varying(255) NOT NULL,
    original_course_id integer,
    title character varying(255) NOT NULL,
    json_path character varying(255) NOT NULL,
    creator_id integer NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    difficulty character varying(50) DEFAULT 'Beginner'::character varying,
    version integer DEFAULT 1 NOT NULL
);
 #   DROP TABLE public.pending_courses;
       public         heap    postgres    false            �            1259    73781    user_progress    TABLE     �   CREATE TABLE public.user_progress (
    user_id integer NOT NULL,
    course_id integer NOT NULL,
    completed_steps integer[] DEFAULT '{}'::integer[]
);
 !   DROP TABLE public.user_progress;
       public         heap    postgres    false            �            1259    73723    users    TABLE     w  CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(10) DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    img_id integer DEFAULT 1 NOT NULL
);
    DROP TABLE public.users;
       public         heap    postgres    false            �            1259    73722    users_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public          postgres    false    216            !           0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public          postgres    false    215            f           2604    73748 
   courses id    DEFAULT     h   ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);
 9   ALTER TABLE public.courses ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    217    218    218            o           2604    73839    notifications id    DEFAULT     t   ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);
 ?   ALTER TABLE public.notifications ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    222    221    222            b           2604    73726    users id    DEFAULT     d   ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
 7   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
       public          postgres    false    216    215    216                      0    73745    courses 
   TABLE DATA              COPY public.courses (id, title, description, difficulty, creator_id, json_path, is_published, created_at, version) FROM stdin;
    public          postgres    false    218   �-                 0    73836    notifications 
   TABLE DATA           b   COPY public.notifications (id, type, message, user_id, metadata, created_at, is_read) FROM stdin;
    public          postgres    false    222   �/                 0    73800    pending_courses 
   TABLE DATA           �   COPY public.pending_courses (id, original_course_id, title, json_path, creator_id, status, created_at, description, difficulty, version) FROM stdin;
    public          postgres    false    220   �/                 0    73781    user_progress 
   TABLE DATA           L   COPY public.user_progress (user_id, course_id, completed_steps) FROM stdin;
    public          postgres    false    219   �/                 0    73723    users 
   TABLE DATA           ]   COPY public.users (id, username, email, password_hash, role, created_at, img_id) FROM stdin;
    public          postgres    false    216   30       "           0    0    courses_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.courses_id_seq', 15, true);
          public          postgres    false    217            #           0    0    notifications_id_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.notifications_id_seq', 47, true);
          public          postgres    false    221            $           0    0    users_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.users_id_seq', 4, true);
          public          postgres    false    215            u           2606    73754    courses courses_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.courses DROP CONSTRAINT courses_pkey;
       public            postgres    false    218            {           2606    73845     notifications notifications_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public            postgres    false    222            y           2606    73821 $   pending_courses pending_courses_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.pending_courses
    ADD CONSTRAINT pending_courses_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.pending_courses DROP CONSTRAINT pending_courses_pkey;
       public            postgres    false    220            w           2606    73788     user_progress user_progress_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (user_id, course_id);
 J   ALTER TABLE ONLY public.user_progress DROP CONSTRAINT user_progress_pkey;
       public            postgres    false    219    219            s           2606    73732    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    216            |           2606    73760    courses IPBL    FK CONSTRAINT     z   ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "IPBL" FOREIGN KEY (creator_id) REFERENCES public.users(id) NOT VALID;
 8   ALTER TABLE ONLY public.courses DROP CONSTRAINT "IPBL";
       public          postgres    false    216    218    4723            }           2606    73853    user_progress fk_course_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT fk_course_id FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE NOT VALID;
 D   ALTER TABLE ONLY public.user_progress DROP CONSTRAINT fk_course_id;
       public          postgres    false    4725    218    219                       2606    73824    pending_courses fk_creator_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.pending_courses
    ADD CONSTRAINT fk_creator_id FOREIGN KEY (creator_id) REFERENCES public.users(id) NOT VALID;
 G   ALTER TABLE ONLY public.pending_courses DROP CONSTRAINT fk_creator_id;
       public          postgres    false    220    4723    216            �           2606    73829 &   pending_courses fk_original_courses_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.pending_courses
    ADD CONSTRAINT fk_original_courses_id FOREIGN KEY (original_course_id) REFERENCES public.courses(id) NOT VALID;
 P   ALTER TABLE ONLY public.pending_courses DROP CONSTRAINT fk_original_courses_id;
       public          postgres    false    4725    218    220            �           2606    73846    notifications fk_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) NOT VALID;
 B   ALTER TABLE ONLY public.notifications DROP CONSTRAINT fk_user_id;
       public          postgres    false    222    4723    216            ~           2606    73858    user_progress fk_user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE NOT VALID;
 B   ALTER TABLE ONLY public.user_progress DROP CONSTRAINT fk_user_id;
       public          postgres    false    219    4723    216               �  x��S�N�P]�~�u�Z 1l�wƍID�<�I\�P����P,��0�G���I#��ΝΜ9gN�8��ܦ����@S�-�3�{�����S�x�q��y����x����(Y�(r�As� �(��xh�m�ܥ�G'�>��>�"";��rT�qۼj�Ǿn6nԝr�n�X��3�X��hb��
w1n#h��."h�
��GM~��f�؅�0շz���k(���<4�j�4;�"��g+�� 9@�is�U�B���+��:�gd0H�,���� ��k�:8`�dN�����M�wߗ1��fku�=J�"٥$���Dwd����\�_�[�UT}�g
N�ŋ�8/��H���L��� �p�JG	r�.��|fU��-:��K�@�
��x�/2�_;��j���>g�%F��b�sJ�?l�*A2�xv�G�WE-WŅmY�/I�i            x������ � �            x������ � �         )   x�3�44�6�1�1�1�1�1�1ױб�14������ j         �   x�3�L.JM,�/�����9�z����*F�*�*����N���f��nΉI��e�zގ)��yU���Q�E���U��~y���p���Lu�t���-�LM�̍,M,M��9��9K�S���,I�fC�Ĕ��<I=�!��܄+F��� ��pT     
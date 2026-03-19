-- Database Backup Export
-- Generated: 2026-02-01
-- Project: Staff Transport App

-- =====================================================
-- COMPANIES
-- =====================================================
INSERT INTO public.companies (id, company_name, site_name, street, building_note, suburb, city, province, latitude, longitude, is_active, verification_status, created_at, updated_at) VALUES
('3e827ae3-f493-4de1-a8cb-c15bd1cd71d1', 'CISCO', NULL, 'Georgian Crescent West', NULL, NULL, 'Randburg', 'Gauteng', -26.0405207, 28.0157744, true, 'pending_verification', '2026-01-21 10:10:13.570227+00', '2026-01-21 10:10:13.570227+00'),
('d2057c3b-636b-4e05-8bab-45dcdf76360b', 'iTalk Financial Services', NULL, 'Kent Avenue', NULL, NULL, 'Randburg', 'Gauteng', -26.09379295, 27.999759718757154, true, 'pending_verification', '2026-01-21 10:40:56.615399+00', '2026-01-21 10:40:56.615399+00'),
('30338887-db75-4c96-89b1-cee8fb203518', 'Bonitas Insurance', NULL, 'Melrose Boulevard', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1332969, 28.0683642, true, 'pending_verification', '2026-01-22 16:33:21.476226+00', '2026-01-22 16:33:21.476226+00'),
('5c5c7045-8fb3-47a9-bccc-e7765630b047', 'Plantonics Corp', NULL, 'Joubert Street', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1976708, 28.0423048, true, 'pending_verification', '2026-01-22 22:19:37.551706+00', '2026-01-22 22:19:37.551706+00'),
('d594739f-c50f-4466-b741-b803b651d409', 'Focus 1', NULL, 'Rahima Moosa Street', NULL, 'Newtown', 'Johannesburg', 'Gauteng', -26.201240400897667, 28.04548276669493, true, 'pending_verification', '2026-01-23 09:38:02.648477+00', '2026-01-23 09:38:02.648477+00'),
('259a6d75-056b-47dd-b429-a6ecaae214d5', 'MiWay Life', NULL, 'Empire Road', NULL, 'Parktown', 'Johannesburg', 'Gauteng', -26.1832219, 28.02084595, true, 'pending_verification', '2026-01-23 10:02:23.057143+00', '2026-01-23 10:02:23.057143+00')
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  site_name = EXCLUDED.site_name,
  street = EXCLUDED.street,
  building_note = EXCLUDED.building_note,
  suburb = EXCLUDED.suburb,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active,
  verification_status = EXCLUDED.verification_status;

-- =====================================================
-- BRANCHES
-- =====================================================
INSERT INTO public.branches (id, company_id, branch_name, street, building_note, suburb, city, province, latitude, longitude, is_active, created_at, updated_at) VALUES
('7ad80eb3-a5c7-4555-91e9-1df9c9673d37', '3e827ae3-f493-4de1-a8cb-c15bd1cd71d1', 'CISCO', 'Georgian Crescent West', NULL, NULL, 'Randburg', 'Gauteng', -26.0405207, 28.0157744, true, '2026-01-21 10:10:13.838829+00', '2026-01-21 10:10:13.838829+00'),
('ec04551d-895a-4bed-b9b0-7a0ba4379be5', 'd2057c3b-636b-4e05-8bab-45dcdf76360b', 'Randburg', 'Kent Avenue', NULL, NULL, 'Randburg', 'Gauteng', -26.09379295, 27.999759718757154, true, '2026-01-21 10:40:56.875892+00', '2026-01-21 10:40:56.875892+00'),
('3f120afd-d63f-4ff0-a97d-12ff24278a97', '30338887-db75-4c96-89b1-cee8fb203518', 'Bonitas Melrose', 'Melrose Boulevard', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1332969, 28.0683642, true, '2026-01-22 16:33:21.884514+00', '2026-01-22 16:33:21.884514+00'),
('abff1803-cdb7-474c-b848-d5187a5ae0a9', '5c5c7045-8fb3-47a9-bccc-e7765630b047', 'Plantonics', 'Joubert Street', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1976708, 28.0423048, true, '2026-01-22 22:19:37.889782+00', '2026-01-22 22:19:37.889782+00'),
('c078ad8a-7445-46fa-9218-a54eb3f0e7de', 'd594739f-c50f-4466-b741-b803b651d409', 'Braamfontein', 'Rahima Moosa Street', NULL, 'Newtown', 'Johannesburg', 'Gauteng', -26.201240400897667, 28.04548276669493, true, '2026-01-23 09:38:02.978151+00', '2026-01-23 09:38:02.978151+00'),
('baef3c2f-c54e-4c82-8e74-fd5000578100', '259a6d75-056b-47dd-b429-a6ecaae214d5', 'Parktown', 'Empire Road', NULL, 'Parktown', 'Johannesburg', 'Gauteng', -26.1832219, 28.02084595, true, '2026-01-23 10:02:24.219318+00', '2026-01-23 10:02:24.219318+00')
ON CONFLICT (id) DO UPDATE SET
  company_id = EXCLUDED.company_id,
  branch_name = EXCLUDED.branch_name,
  street = EXCLUDED.street,
  building_note = EXCLUDED.building_note,
  suburb = EXCLUDED.suburb,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- SCHOOLS
-- =====================================================
INSERT INTO public.schools (id, school_name, street, building_note, suburb, city, province, latitude, longitude, is_active, verification_status, created_at, updated_at) VALUES
('d560ac2c-5cc3-49bd-9f6a-e29ffba6e84a', 'Athlone Boys High School', 'Bezuidenhout Avenue', NULL, NULL, 'Johannesburg', 'Gauteng', -26.18632672130886, 28.0796984121838, true, 'pending_verification', '2026-01-22 16:46:08.419328+00', '2026-01-22 16:46:08.419328+00'),
('fb422beb-867b-47b7-92d6-1ac9ac8c5f22', 'Malvern High School', 'Saint Frusquin Street', NULL, NULL, 'Johannesburg', 'Gauteng', -26.20065339104451, 28.108197941914842, true, 'pending_verification', '2026-01-22 22:27:56.096269+00', '2026-01-22 22:27:56.096269+00'),
('74398e98-3bb3-4201-9e2c-9f8102b554e0', 'Banato High School', 'Beatrice Lane', NULL, 'Berea', 'Johannesburg', 'Gauteng', -26.185591415915592, 28.050885191889446, true, 'pending_verification', '2026-01-23 09:44:27.382095+00', '2026-01-23 09:44:27.382095+00'),
('7a2b044c-7cfa-4479-88f2-23c4e37eb855', 'Kensington Secondary School', 'New York Road', NULL, 'South Kensington', 'Johannesburg', 'Gauteng', -26.189862660314734, 28.102029786496413, true, 'pending_verification', '2026-01-23 10:09:05.563698+00', '2026-01-23 10:09:05.563698+00')
ON CONFLICT (id) DO UPDATE SET
  school_name = EXCLUDED.school_name,
  street = EXCLUDED.street,
  building_note = EXCLUDED.building_note,
  suburb = EXCLUDED.suburb,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  is_active = EXCLUDED.is_active,
  verification_status = EXCLUDED.verification_status;

-- =====================================================
-- PROFILES
-- =====================================================
INSERT INTO public.profiles (id, user_id, email, full_name, phone, avatar_url, created_at, updated_at) VALUES
('7e208683-41a4-4279-82d2-45842da4c230', 'e9c121ae-8619-4444-9267-3ffa413364de', 'obi752@gmail.com', 'Obinna Maosa', '0635214124', NULL, '2026-01-23 09:41:06.103266+00', '2026-01-23 09:41:25.781843+00'),
('db6d8e76-d51a-4613-a70e-815b42cb19b1', '18f891e7-3269-4216-a034-6e3aa02f4bd0', 'abongilem@miway.co.za', 'Abongile Mdletshe', '0781245432', NULL, '2026-01-23 09:58:55.800376+00', '2026-01-23 09:59:31.733304+00'),
('5ee46cfa-2972-46de-8915-ddcdb10716bb', '228b5a78-a647-4609-a0d5-e26d54ada9db', 'smangalisombagwu@gmail.com', 'Smangaliso Mbagwu', '0789005206', NULL, '2026-01-02 01:23:20.632978+00', '2026-01-08 20:38:22.116377+00'),
('748eac25-115f-4828-801d-1e05ef47eaf3', '2b2700e4-7200-4e18-b796-ab79c5438b28', 'ccddg2@gmail.com', 'Caiphas Kalonji', '0728154122', NULL, '2026-01-23 10:05:36.406085+00', '2026-01-23 10:05:58.154541+00'),
('ffcdc253-b519-4a13-861c-94cfcb01b9e6', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 'dsw.underground@gmail.com', 'Jazmin Ngoyi', '0829234564', NULL, '2026-01-04 12:11:44.630263+00', '2026-01-23 11:59:13.076594+00'),
('32dcaec8-37b3-4ad8-b549-4609ab15ca3f', '2ca82108-b59c-4d1e-ace5-cc897aba5d31', 'jamesfaroe@uj.ac.edu', 'James Faroe', '0895258970', NULL, '2026-01-13 17:04:16.62172+00', '2026-01-13 17:04:46.605781+00'),
('04bd5770-850d-4285-abb8-0b069954a9c2', 'a5f3e0ad-3c91-4734-a01a-1772bcc4c493', 'smanga@streetsurfers.com', 'Derrick Issoc', '0815526321', NULL, '2026-01-12 16:06:15.100575+00', '2026-01-13 17:13:28.697865+00'),
('f299525c-af01-493d-a500-c4ac0e89e27d', '0770190e-ccc5-4ab7-a5c1-42cb88321751', 'jezit@cisco.com', 'Thamsanqa Jezi', '0852251231', NULL, '2026-01-15 17:57:33.356225+00', '2026-01-15 20:55:44.954463+00'),
('dccdd5da-17a4-4094-8554-e3720861bc7f', '1f79ece1-07ce-4f7d-b521-f0fb5945c4b9', 'smangalisombagwu2@gmail.com', 'Smangaliso Mbagwu', '0819005268', NULL, '2026-01-21 09:32:29.387163+00', '2026-01-21 10:07:54.764478+00'),
('eeda6a78-c60c-40c8-95ac-ca734ff8c1fb', 'e08c913b-432f-4e26-b813-f85230372869', 'soyisis@gmail.com', 'Snethemba Soyisi', '0653258521', NULL, '2026-01-20 15:44:08.69347+00', '2026-01-21 10:25:15.689277+00'),
('400df90f-42a9-4eb0-a7bd-b78f2b20b1a6', '74dd258e-6fb3-46ac-bd1b-0fb56008c3c8', 'sammbagewu@gmail.com', 'Smangaliso Mbagwu', '0922727611', NULL, '2026-01-21 10:33:45.955623+00', '2026-01-21 10:38:25.74648+00'),
('71866d7a-86cf-4cd9-a415-3901e244449d', 'db469594-1067-4747-9fef-4f4f254f514a', 'soyisin@italk.com', 'Ntombenhle Soyisi', '0752345421', NULL, '2026-01-21 10:27:08.917751+00', '2026-01-22 09:29:44.917863+00'),
('a0ce2cdd-1216-489a-b96b-17a931e76114', '0c2cbc9e-e605-4cf0-9a02-21d377530481', 'sizwed@bonitas.za', 'Sizwe Dhlomo', '0855423258', NULL, '2026-01-22 16:28:24.877972+00', '2026-01-22 16:29:17.683422+00'),
('7cf505f5-fdc8-45ce-a10d-b3518bf85096', 'dd9370c2-666c-4068-ac97-80221d23d9cb', 'sindiswa4867@gmail.com', 'Sinidiswa Moeti', '0741235480', NULL, '2026-01-22 16:38:17.541383+00', '2026-01-22 16:42:08.812933+00'),
('03bdadd4-22cf-4078-aae2-06d30373f742', '5da5b521-5f3f-46ab-b461-098d25a39ce8', 'siviweg@plantonics.co.za', 'Siviwe Gamalitshoyo', '0859632541', NULL, '2026-01-22 22:12:42.572666+00', '2026-01-22 22:14:07.966237+00'),
('25bb4a55-7152-49fb-90e6-acbfa2fea104', '9a3b6991-f7ab-47ac-b280-78330bde6365', 'emihle456@gmail.com', 'Emihle Mutombo', '0748552132', NULL, '2026-01-22 22:23:46.044672+00', '2026-01-22 22:24:19.219776+00'),
('4188d021-a5fc-4b80-870d-a8990bc49e57', 'da1b8715-e0af-4883-9d85-0dbb3b9a83d5', 'sindisiwes@focus1.com', 'Sindisiwe Stalin', '0789245410', NULL, '2026-01-23 09:34:03.778937+00', '2026-01-23 09:34:39.093638+00')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  avatar_url = EXCLUDED.avatar_url;

-- =====================================================
-- USER_ROLES
-- =====================================================
INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES
('ed514968-9ae9-4bca-9dfa-6939a7359818', 'a5f3e0ad-3c91-4734-a01a-1772bcc4c493', 'passenger', '2026-01-12 16:06:15.100575+00'),
('97ef9998-4aed-4d62-b753-99b3c69e2dde', '2ca82108-b59c-4d1e-ace5-cc897aba5d31', 'passenger', '2026-01-13 17:04:16.62172+00'),
('610e3668-083a-421e-84c6-907e51763156', '0770190e-ccc5-4ab7-a5c1-42cb88321751', 'passenger', '2026-01-15 17:57:33.356225+00'),
('16fb8cf7-fa80-4549-946d-32c6fbe3cb67', 'e08c913b-432f-4e26-b813-f85230372869', 'passenger', '2026-01-20 15:44:08.69347+00'),
('7b0234d1-3b74-4c7f-9d4e-699ecaf0f1b7', '1f79ece1-07ce-4f7d-b521-f0fb5945c4b9', 'passenger', '2026-01-21 09:32:29.387163+00'),
('e8d61ec9-c58b-4354-8a84-2ef6997173dd', 'db469594-1067-4747-9fef-4f4f254f514a', 'passenger', '2026-01-21 10:27:08.917751+00'),
('e693af33-b53e-49b8-a3ae-667aa67e53bc', '74dd258e-6fb3-46ac-bd1b-0fb56008c3c8', 'passenger', '2026-01-21 10:33:45.955623+00'),
('87d30a65-68f4-4a46-a4fa-f63e02bede77', '0c2cbc9e-e605-4cf0-9a02-21d377530481', 'passenger', '2026-01-22 16:28:24.877972+00'),
('c976c4c9-a5b1-46d9-acc9-2d4c32452024', 'dd9370c2-666c-4068-ac97-80221d23d9cb', 'passenger', '2026-01-22 16:38:17.541383+00'),
('1a2ca5a8-6875-4153-961e-385e54be6dc0', '5da5b521-5f3f-46ab-b461-098d25a39ce8', 'passenger', '2026-01-22 22:12:42.572666+00'),
('42590c3e-dcf6-4319-87ba-823b102383f8', '9a3b6991-f7ab-47ac-b280-78330bde6365', 'passenger', '2026-01-22 22:23:46.044672+00'),
('afe29372-f9a6-4a7d-aa9f-c4fe8882f0e8', 'da1b8715-e0af-4883-9d85-0dbb3b9a83d5', 'passenger', '2026-01-23 09:34:03.778937+00'),
('74e6322a-24ab-48b6-b68d-69834469cee4', 'e9c121ae-8619-4444-9267-3ffa413364de', 'passenger', '2026-01-23 09:41:06.103266+00'),
('dc22b999-dced-4a0f-bc04-5cee2095efaa', '18f891e7-3269-4216-a034-6e3aa02f4bd0', 'passenger', '2026-01-23 09:58:55.800376+00'),
('69a5929c-3c65-4359-b29a-6b15f25c74c6', '2b2700e4-7200-4e18-b796-ab79c5438b28', 'passenger', '2026-01-23 10:05:36.406085+00')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SCHOLAR_PROFILES
-- =====================================================
INSERT INTO public.scholar_profiles (id, passenger_id, guardian_full_name, guardian_phone, guardian_email, school_name, grade_year, created_at, updated_at) VALUES
('e8990dcb-03b8-4c76-acb3-5ff451b1b899', 'dd5a30d3-62d9-4b14-b999-c73be0acec0a', 'Portia Soyisi', '0800526345', NULL, 'Athlone Boys High School', 'Grade 11', '2026-01-22 16:46:09.334155+00', '2026-01-22 16:46:09.334155+00'),
('7ebf0bf3-9a1e-42c6-9196-8fc6a6e154d7', '835232fd-0b99-4b58-8b1e-4bc0b7163aa7', 'Patiswa Mutombo', '0786005248', 'patiswam@gmail.com', 'Malvern High School', 'Grade 10', '2026-01-22 22:27:56.771239+00', '2026-01-22 22:27:56.771239+00'),
('65e0a83d-64f4-4d43-b00a-8cb44606620a', '8b434963-94a4-4570-8d87-56b4c94442b6', 'Portia Maosa', '0815123456', NULL, 'Banato High School', 'Grade 10', '2026-01-23 09:44:28.024258+00', '2026-01-23 09:44:28.024258+00'),
('c88675d0-9f5e-4d74-b6fa-aa78f10e2dc5', '8068f598-e1fc-4dc3-afee-b9bb3a5c8aca', 'Zaeid Kalonji Mohammed', '0863245211', NULL, 'Kensington Secondary School', 'Grade 9', '2026-01-23 10:09:06.149181+00', '2026-01-23 10:09:06.149181+00')
ON CONFLICT (id) DO UPDATE SET
  passenger_id = EXCLUDED.passenger_id,
  guardian_full_name = EXCLUDED.guardian_full_name,
  guardian_phone = EXCLUDED.guardian_phone,
  guardian_email = EXCLUDED.guardian_email,
  school_name = EXCLUDED.school_name,
  grade_year = EXCLUDED.grade_year;

-- =====================================================
-- TRIPS
-- =====================================================
INSERT INTO public.trips (id, driver_id, trip_type, scheduled_date, pickup_time, pickup_time_window_minutes, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, status, actual_start_time, actual_end_time, notes, created_at, updated_at) VALUES
('47aac873-00c8-44ac-9ecd-2fcd0068438e', NULL, 'inbound', '2026-01-04', '07:30:00', 15, '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, 'scheduled', NULL, NULL, NULL, '2026-01-04 12:09:48.694056+00', '2026-01-04 12:09:48.694056+00'),
('8d5633f0-7475-4003-bf98-111b9aa9605c', NULL, 'outbound', '2026-01-04', '17:00:00', 15, 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 'scheduled', NULL, NULL, NULL, '2026-01-04 12:09:48.694056+00', '2026-01-04 12:09:48.694056+00'),
('a470560e-b2cd-4439-b550-df346eeea4d8', NULL, 'inbound', '2026-01-05', '07:30:00', 15, '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, 'scheduled', NULL, NULL, NULL, '2026-01-04 12:09:48.694056+00', '2026-01-04 12:09:48.694056+00'),
('5de96afb-368a-411a-8d77-7f1cd8350cc9', NULL, 'inbound', '2026-01-13', '07:00:00', 15, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'scheduled', NULL, NULL, NULL, '2026-01-12 14:42:29.289875+00', '2026-01-12 14:42:29.289875+00'),
('09911741-ff47-43de-973c-054068f31a5d', NULL, 'outbound', '2026-01-13', '17:00:00', 15, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'scheduled', NULL, NULL, NULL, '2026-01-12 14:42:29.289875+00', '2026-01-12 14:42:29.289875+00'),
('cc078537-5735-4f69-9e6c-674f04793f86', NULL, 'inbound', '2026-01-14', '07:30:00', 15, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'scheduled', NULL, NULL, NULL, '2026-01-12 14:42:29.289875+00', '2026-01-12 14:42:29.289875+00'),
('d3fb0234-5602-4ede-a013-a32641105587', NULL, 'outbound', '2026-01-14', '17:30:00', 15, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'scheduled', NULL, NULL, NULL, '2026-01-12 14:42:29.289875+00', '2026-01-12 14:42:29.289875+00')
ON CONFLICT (id) DO UPDATE SET
  driver_id = EXCLUDED.driver_id,
  trip_type = EXCLUDED.trip_type,
  scheduled_date = EXCLUDED.scheduled_date,
  pickup_time = EXCLUDED.pickup_time,
  pickup_time_window_minutes = EXCLUDED.pickup_time_window_minutes,
  origin_address = EXCLUDED.origin_address,
  origin_lat = EXCLUDED.origin_lat,
  origin_lng = EXCLUDED.origin_lng,
  destination_address = EXCLUDED.destination_address,
  destination_lat = EXCLUDED.destination_lat,
  destination_lng = EXCLUDED.destination_lng,
  status = EXCLUDED.status,
  actual_start_time = EXCLUDED.actual_start_time,
  actual_end_time = EXCLUDED.actual_end_time,
  notes = EXCLUDED.notes;

-- =====================================================
-- TRIP_PASSENGERS
-- =====================================================
INSERT INTO public.trip_passengers (id, trip_id, passenger_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng, seat_number, status, pickup_time, dropoff_time, created_at, updated_at) VALUES
('988c2191-07b3-4442-8583-a974c2d489c0', '47aac873-00c8-44ac-9ecd-2fcd0068438e', '228b5a78-a647-4609-a0d5-e26d54ada9db', '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, 1, 'confirmed', NULL, NULL, '2026-01-04 12:10:18.144389+00', '2026-01-04 12:10:18.144389+00'),
('db6843bc-0122-4e2b-b35a-a8d338b26bad', '8d5633f0-7475-4003-bf98-111b9aa9605c', '228b5a78-a647-4609-a0d5-e26d54ada9db', 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 1, 'confirmed', NULL, NULL, '2026-01-04 12:10:18.144389+00', '2026-01-04 12:10:18.144389+00'),
('f6436e6c-19a5-4396-9f43-043b6997c4eb', 'a470560e-b2cd-4439-b550-df346eeea4d8', '228b5a78-a647-4609-a0d5-e26d54ada9db', '123 Sandton Drive, Sandton', -26.10760000, 28.05670000, 'Street Surfers HQ, Braamfontein', -26.20410000, 28.04730000, 1, 'confirmed', NULL, NULL, '2026-01-04 12:10:18.144389+00', '2026-01-04 12:10:18.144389+00'),
('5087215d-dadd-47e6-a596-08dd8b7a92c5', '5de96afb-368a-411a-8d77-7f1cd8350cc9', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, NULL, 'confirmed', NULL, NULL, '2026-01-12 14:43:18.922459+00', '2026-01-12 14:43:18.922459+00'),
('9d58ea6e-ad83-420d-ba96-0daa29597292', '09911741-ff47-43de-973c-054068f31a5d', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, NULL, 'confirmed', NULL, NULL, '2026-01-12 14:43:18.922459+00', '2026-01-12 14:43:18.922459+00'),
('d152f085-d4ae-40d4-9346-7e7d9b770333', 'cc078537-5735-4f69-9e6c-674f04793f86', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, NULL, 'confirmed', NULL, NULL, '2026-01-12 14:43:18.922459+00', '2026-01-12 14:43:18.922459+00'),
('5cc5fefb-a6e0-40d2-9fd2-d05cc195102e', 'd3fb0234-5602-4ede-a013-a32641105587', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 'Sandton City, Rivonia Road, Sandton', -26.10760000, 28.05670000, 'Becker Street, Yeoville, Johannesburg', -26.17980000, 28.06390000, NULL, 'confirmed', NULL, NULL, '2026-01-12 14:43:18.922459+00', '2026-01-12 14:43:18.922459+00')
ON CONFLICT (id) DO UPDATE SET
  trip_id = EXCLUDED.trip_id,
  passenger_id = EXCLUDED.passenger_id,
  pickup_address = EXCLUDED.pickup_address,
  pickup_lat = EXCLUDED.pickup_lat,
  pickup_lng = EXCLUDED.pickup_lng,
  dropoff_address = EXCLUDED.dropoff_address,
  dropoff_lat = EXCLUDED.dropoff_lat,
  dropoff_lng = EXCLUDED.dropoff_lng,
  seat_number = EXCLUDED.seat_number,
  status = EXCLUDED.status,
  pickup_time = EXCLUDED.pickup_time,
  dropoff_time = EXCLUDED.dropoff_time;

-- =====================================================
-- NOTE: PASSENGERS table has complex data with many NULL values
-- This requires a separate restore due to foreign key relationships
-- The passengers are linked to users via user_id (auth.users)
-- =====================================================

-- =====================================================
-- AVAILABILITY_REQUESTS (sample - full data truncated for brevity)
-- =====================================================
INSERT INTO public.availability_requests (id, passenger_id, day_of_week, inbound_time, outbound_time, effective_from, effective_until, week_start, notes, status, created_at, updated_at) VALUES
('65a928c2-7975-42e0-b238-2be15e759e4f', '228b5a78-a647-4609-a0d5-e26d54ada9db', 1, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('deb84cde-6c79-4a2b-b050-8b7e1daba9a6', '228b5a78-a647-4609-a0d5-e26d54ada9db', 2, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('316d4a35-fea8-448d-8916-75a4c6004375', '228b5a78-a647-4609-a0d5-e26d54ada9db', 3, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('151ec123-dc29-42e1-98c7-132dc298e202', '228b5a78-a647-4609-a0d5-e26d54ada9db', 4, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('ab1eb50e-cfa5-44d0-9bb6-2932406212b3', '228b5a78-a647-4609-a0d5-e26d54ada9db', 5, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('eb465224-ff9a-4bdd-8258-25bf8961f1e8', '228b5a78-a647-4609-a0d5-e26d54ada9db', 6, '13:30:00', '22:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:40:21.107384+00', '2026-01-08 20:40:21.107384+00'),
('2db9d87e-7fa6-4b7f-9b7f-588fc08e31a3', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 1, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00'),
('c42fffff-c06c-443a-96ce-c16b9744a930', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 2, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00'),
('ef6ab919-8358-4bee-9712-87129fab3980', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 3, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00'),
('3ab03c46-94b2-441c-9e58-e447b777065e', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 4, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00'),
('a9d075b4-40b6-4467-8b70-a313d84eb7e9', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 5, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00'),
('024bea4c-7461-45af-9ccd-c86e4878ffe2', '2e4d2c59-c157-4f39-b19f-56cf96ab47e4', 6, '07:30:00', '17:00:00', '2026-01-08', NULL, NULL, NULL, 'pending', '2026-01-08 20:43:07.487148+00', '2026-01-08 20:43:07.487148+00')
ON CONFLICT (id) DO UPDATE SET
  passenger_id = EXCLUDED.passenger_id,
  day_of_week = EXCLUDED.day_of_week,
  inbound_time = EXCLUDED.inbound_time,
  outbound_time = EXCLUDED.outbound_time,
  effective_from = EXCLUDED.effective_from,
  effective_until = EXCLUDED.effective_until,
  week_start = EXCLUDED.week_start,
  notes = EXCLUDED.notes,
  status = EXCLUDED.status;

-- =====================================================
-- END OF BACKUP
-- =====================================================

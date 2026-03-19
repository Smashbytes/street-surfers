-- =====================================================
-- STREET SURFERS - REFERENCE DATA IMPORT
-- Run this AFTER MIGRATION_FULL.sql in the SQL Editor
-- Safe to import: companies, branches, schools, trips
-- (profiles, passengers, user_roles are auto-created
--  when users re-sign up via the handle_new_user trigger)
-- =====================================================

-- =====================================================
-- COMPANIES
-- NOTE: companies table was pre-created by the Driver's App.
-- Actual columns: id, name, address, contact_person, contact_phone,
--                 contact_email, is_school, created_at, updated_at
-- =====================================================
INSERT INTO public.companies (id, name, address, contact_person, contact_phone, contact_email, is_school, created_at, updated_at) VALUES
('3e827ae3-f493-4de1-a8cb-c15bd1cd71d1', 'CISCO', 'Georgian Crescent West, Randburg, Gauteng', NULL, NULL, NULL, false, '2026-01-21 10:10:13.570227+00', '2026-01-21 10:10:13.570227+00'),
('d2057c3b-636b-4e05-8bab-45dcdf76360b', 'iTalk Financial Services', 'Kent Avenue, Randburg, Gauteng', NULL, NULL, NULL, false, '2026-01-21 10:40:56.615399+00', '2026-01-21 10:40:56.615399+00'),
('30338887-db75-4c96-89b1-cee8fb203518', 'Bonitas Insurance', 'Melrose Boulevard, Johannesburg, Gauteng', NULL, NULL, NULL, false, '2026-01-22 16:33:21.476226+00', '2026-01-22 16:33:21.476226+00'),
('5c5c7045-8fb3-47a9-bccc-e7765630b047', 'Plantonics Corp', 'Joubert Street, Johannesburg, Gauteng', NULL, NULL, NULL, false, '2026-01-22 22:19:37.551706+00', '2026-01-22 22:19:37.551706+00'),
('d594739f-c50f-4466-b741-b803b651d409', 'Focus 1', 'Rahima Moosa Street, Newtown, Johannesburg, Gauteng', NULL, NULL, NULL, false, '2026-01-23 09:38:02.648477+00', '2026-01-23 09:38:02.648477+00'),
('259a6d75-056b-47dd-b429-a6ecaae214d5', 'MiWay Life', 'Empire Road, Parktown, Johannesburg, Gauteng', NULL, NULL, NULL, false, '2026-01-23 10:02:23.057143+00', '2026-01-23 10:02:23.057143+00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  is_school = EXCLUDED.is_school;

-- =====================================================
-- BRANCHES
-- =====================================================
INSERT INTO public.branches (id, company_id, branch_name, street, building_note, suburb, city, province, latitude, longitude, is_active, created_at, updated_at) VALUES
('7ad80eb3-a5c7-4555-91e9-1df9c9673d37', '3e827ae3-f493-4de1-a8cb-c15bd1cd71d1', 'CISCO', 'Georgian Crescent West', NULL, NULL, 'Randburg', 'Gauteng', -26.0405207, 28.0157744, true, '2026-01-21 10:10:13.838829+00', '2026-01-21 10:10:13.838829+00'),
('ec04551d-895a-4bed-b9b0-7a0ba4379be5', 'd2057c3b-636b-4e05-8bab-45dcdf76360b', 'Randburg', 'Kent Avenue', NULL, NULL, 'Randburg', 'Gauteng', -26.09379295, 27.999759718757154, true, '2026-01-21 10:40:56.875892+00', '2026-01-21 10:40:56.875892+00'),
('3f120afd-d63f-4ff0-a97d-12ff24278a97', '30338887-db75-4c96-89b1-cee8fb203518', 'Bonitas Melrose', 'Melrose Boulevard', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1332969, 28.0683642, true, '2026-01-22 16:33:21.884514+00', '2026-01-22 16:33:21.884514+00'),
('abff1803-cdb7-474c-b848-d5187a5ae0a9', '5c5c7045-8fb3-47a9-bccc-e7765630b047', 'Plantonics', 'Joubert Street', NULL, NULL, 'Johannesburg', 'Gauteng', -26.1976708, 28.0423048, true, '2026-01-22 22:19:37.889782+00', '2026-01-22 22:19:37.889782+00'),
('c078ad8a-7445-46fa-9218-a54eb3f0e7de', 'd594739f-c50f-4466-b741-b803b651d409', 'Braamfontein', 'Rahima Moosa Street', NULL, 'Newtown', 'Johannesburg', 'Gauteng', -26.201240400897667, 28.04548276669493, true, '2026-01-23 09:38:02.978151+00', '2026-01-23 09:38:02.978151+00'),
('baef3c2f-c54e-4c82-8e74-fd5000578100', '259a6d75-056b-47dd-b429-a6ecaae214d5', 'Parktown', 'Empire Road', NULL, 'Parktown', 'Johannesburg', 'Gauteng', -26.1832219, 28.02084595, true, '2026-01-23 10:02:24.219332+00', '2026-01-23 10:02:24.219332+00')
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
-- TRIPS (driver_id is NULL - no user dependency)
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
  trip_type = EXCLUDED.trip_type,
  scheduled_date = EXCLUDED.scheduled_date,
  pickup_time = EXCLUDED.pickup_time,
  origin_address = EXCLUDED.origin_address,
  destination_address = EXCLUDED.destination_address,
  status = EXCLUDED.status;

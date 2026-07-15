/*
  RMS Hospital Research Management System
  Detailed Vietnamese hospital research seed data — PostgreSQL 15+ version
  (requires MERGE, added in PG15; tested on PG16)
  Run after RMS_PostgreSQL_DDL.md schema.
*/

BEGIN;

/* =========================================================
   1. Departments
   ========================================================= */
DROP TABLE IF EXISTS tmp_departments;
CREATE TEMP TABLE tmp_departments (
    department_code VARCHAR(50) PRIMARY KEY,
    department_name VARCHAR(255),
    department_type VARCHAR(100),
    sort_order       INTEGER
);

INSERT INTO tmp_departments VALUES
    ('KB',   'Khoa Khám bệnh', 'Khoa', 10),
    ('QLCL', 'Phòng Quản lý chất lượng', 'Phòng', 11),
    ('RESP', 'Khoa Nội hô hấp', 'Khoa', 12),
    ('CTXH', 'Phòng Công tác xã hội', 'Phòng', 13),
    ('DD',   'Phòng Điều dưỡng', 'Phòng', 14),
    ('HSBA', 'Phòng Kế hoạch tổng hợp - Hồ sơ bệnh án', 'Phòng', 15),
    ('STAT', 'Tổ Thống kê y học', 'Tổ', 16);

MERGE INTO ref.departments AS tgt
USING tmp_departments AS src
    ON tgt.department_code = src.department_code
WHEN MATCHED THEN
    UPDATE SET department_name = src.department_name,
               department_type = src.department_type,
               sort_order = src.sort_order,
               is_active = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (department_code, department_name, department_type, sort_order, is_active)
    VALUES (src.department_code, src.department_name, src.department_type, src.sort_order, true);

/* =========================================================
   2. Users
   password_hash is demo only. Real password must be hashed by .NET identity/auth service.
   ========================================================= */
DROP TABLE IF EXISTS tmp_users;
CREATE TEMP TABLE tmp_users (
    username         VARCHAR(100) PRIMARY KEY,
    email            VARCHAR(255),
    full_name        VARCHAR(255),
    initials         VARCHAR(20),
    title            VARCHAR(255),
    department_code  VARCHAR(50),
    is_system_admin  BOOLEAN
);

INSERT INTO tmp_users VALUES
    ('admin', 'admin@hospital.vn', 'Quản trị hệ thống', 'QT', 'Quản trị viên', 'RMO', true),
    ('nguyenvanan', 'nguyenvanan@hospital.vn', 'BS.CKII Nguyễn Văn An', 'NVA', 'Chủ nhiệm đề tài', 'KB', false),
    ('tranthimai', 'tranthimai@hospital.vn', 'CN Trần Thị Mai', 'TTM', 'Điều phối nghiên cứu', 'RMO', false),
    ('nguyenvanbinh', 'nguyenvanbinh@hospital.vn', 'BS Nguyễn Văn Bình', 'NVB', 'Thành viên nghiên cứu', 'KB', false),
    ('leminhkhang', 'leminhkhang@hospital.vn', 'ThS.BS Lê Minh Khang', 'LMK', 'Bác sĩ điều trị', 'ENDO', false),
    ('phamngochan', 'phamngochan@hospital.vn', 'CN Phạm Ngọc Hân', 'PNH', 'Điều dưỡng nghiên cứu', 'ENDO', false),
    ('tranquocbao', 'tranquocbao@hospital.vn', 'BS.CKI Trần Quốc Bảo', 'TQB', 'Chuyên viên cải tiến chất lượng', 'QLCL', false),
    ('vothithanh', 'vothithanh@hospital.vn', 'CN Võ Thị Thanh', 'VTT', 'Chuyên viên thống kê', 'STAT', false),
    ('phamhoangnam', 'phamhoangnam@hospital.vn', 'TS.BS Phạm Hoàng Nam', 'PHN', 'Trưởng nhóm nghiên cứu', 'RESP', false),
    ('nguyenthimylinh', 'nguyenthimylinh@hospital.vn', 'CN Nguyễn Thị Mỹ Linh', 'NTML', 'Điều phối hồ sơ bệnh án', 'RESP', false),
    ('huynhthilan', 'huynhthilan@hospital.vn', 'BS.CKII Huỳnh Thị Lan', 'HTL', 'Chủ nhiệm đề tài', 'CTXH', false),
    ('lethithuha', 'lethithuha@hospital.vn', 'CN Lê Thị Thu Hà', 'LTTH', 'Điều phối khảo sát', 'CTXH', false),
    ('hoidongdaoduc', 'ethics.office@hospital.vn', 'Thư ký Hội đồng Đạo đức', 'HĐ', 'Thư ký hội đồng', 'RMO', false);

MERGE INTO auth.users AS tgt
USING (
    SELECT u.*, d.department_id
    FROM tmp_users u
    LEFT JOIN ref.departments d ON d.department_code = u.department_code
) AS src
    ON tgt.username = src.username
WHEN MATCHED THEN
    UPDATE SET email = src.email,
               full_name = src.full_name,
               initials = src.initials,
               title = src.title,
               department_id = src.department_id,
               account_status = 'active',
               is_system_admin = src.is_system_admin,
               email_confirmed = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        username, email, password_hash, password_salt, full_name, initials, title,
        department_id, account_status, is_system_admin, email_confirmed,
        must_change_password, password_changed_at
    )
    VALUES (
        src.username, src.email, 'demo-hash-not-for-production', 'demo-salt',
        src.full_name, src.initials, src.title, src.department_id, 'active',
        src.is_system_admin, true, false, now()
    );

INSERT INTO auth.user_preferences (user_id)
SELECT u.user_id
FROM auth.users u
INNER JOIN tmp_users su ON su.username = u.username
WHERE NOT EXISTS (SELECT 1 FROM auth.user_preferences p WHERE p.user_id = u.user_id);

INSERT INTO auth.user_roles (user_id, role_id, assigned_by)
SELECT u.user_id, r.role_id, admin.user_id
FROM auth.users u
INNER JOIN tmp_users su ON su.username = u.username
INNER JOIN auth.roles r ON r.role_code =
    CASE
        WHEN su.is_system_admin THEN 'ADMIN'
        WHEN su.username IN ('tranthimai', 'hoidongdaoduc') THEN 'RESEARCH_OFFICE'
        WHEN su.username IN ('nguyenvanan', 'leminhkhang', 'tranquocbao', 'phamhoangnam', 'huynhthilan') THEN 'PI'
        ELSE 'RESEARCH_MEMBER'
    END
LEFT JOIN LATERAL (SELECT user_id FROM auth.users WHERE username = 'admin' LIMIT 1) admin ON true
WHERE NOT EXISTS (
    SELECT 1 FROM auth.user_roles ur
    WHERE ur.user_id = u.user_id AND ur.role_id = r.role_id
);

/* =========================================================
   3. Sponsors
   ========================================================= */
DROP TABLE IF EXISTS tmp_sponsors;
CREATE TEMP TABLE tmp_sponsors (
    sponsor_code   VARCHAR(100) PRIMARY KEY,
    sponsor_name   VARCHAR(255),
    sponsor_type   VARCHAR(100),
    contact_person VARCHAR(255)
);

INSERT INTO tmp_sponsors VALUES
    ('BV-NT', 'Nguồn kinh phí nội bộ bệnh viện', 'Nội bộ', 'Phòng Tài chính kế toán'),
    ('DHYD-HCM', 'Đại học Y Dược Thành phố Hồ Chí Minh', 'Đại học', 'Phòng Khoa học Công nghệ'),
    ('QLCL-BV', 'Chương trình cải tiến chất lượng bệnh viện', 'Nội bộ', 'Phòng Quản lý chất lượng');

MERGE INTO research.sponsors AS tgt
USING tmp_sponsors AS src
    ON tgt.sponsor_code = src.sponsor_code
WHEN MATCHED THEN
    UPDATE SET sponsor_name = src.sponsor_name,
               sponsor_type = src.sponsor_type,
               contact_person = src.contact_person,
               is_active = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (sponsor_code, sponsor_name, sponsor_type, contact_person, is_active)
    VALUES (src.sponsor_code, src.sponsor_name, src.sponsor_type, src.contact_person, true);

/* =========================================================
   4. Research projects
   DB stores enum codes, UI maps them to Vietnamese labels.
   ========================================================= */
DROP TABLE IF EXISTS tmp_projects;
CREATE TEMP TABLE tmp_projects (
    project_code           VARCHAR(100) PRIMARY KEY,
    project_title          VARCHAR(500),
    project_description    TEXT,
    department_code        VARCHAR(50),
    pi_username            VARCHAR(100),
    sponsor_code           VARCHAR(100),
    research_type          VARCHAR(100),
    protocol_number        VARCHAR(100),
    ethics_status           VARCHAR(100),
    ethics_approval_number  VARCHAR(100) NULL,
    ethics_approval_date     DATE NULL,
    ethics_expiry_date        DATE NULL,
    planned_start_date         DATE,
    planned_end_date            DATE,
    actual_start_date            DATE NULL,
    actual_end_date                DATE NULL,
    current_phase_name             VARCHAR(255),
    progress_percent                 NUMERIC(5,2),
    project_status                    VARCHAR(100),
    health_status                      VARCHAR(100),
    risk_level                          VARCHAR(50),
    priority_level                       VARCHAR(50)
);

INSERT INTO tmp_projects VALUES
    ('NC-2026-001',
     'Nghiên cứu tỷ lệ kiểm soát huyết áp ở người bệnh tăng huyết áp điều trị ngoại trú',
     'Theo dõi tỷ lệ kiểm soát huyết áp, yếu tố liên quan và tuân thủ điều trị ở người bệnh tăng huyết áp đang điều trị ngoại trú.',
     'KB', 'nguyenvanan', 'BV-NT', 'Nghiên cứu mô tả cắt ngang', 'RMS-HTN-2026-001',
     'approved', 'HĐĐĐ-2026-015', '2026-01-20', '2027-01-20',
     '2026-01-05', '2026-12-20', '2026-01-06', NULL,
     'Thu thập số liệu', 62, 'in_progress', 'at_risk', 'high', 'high'),

    ('NC-2026-002',
     'Đánh giá hiệu quả tư vấn dinh dưỡng cho người bệnh đái tháo đường type 2',
     'Đánh giá thay đổi HbA1c, chỉ số BMI và kiến thức dinh dưỡng sau chương trình tư vấn cho người bệnh đái tháo đường type 2.',
     'ENDO', 'leminhkhang', 'DHYD-HCM', 'Nghiên cứu can thiệp', 'RMS-DM2-2026-002',
     'approved', 'HĐĐĐ-2026-022', '2026-02-12', '2027-02-12',
     '2026-02-01', '2026-10-30', '2026-02-03', NULL,
     'Thu thập số liệu', 48, 'in_progress', 'on_track', 'medium', 'normal'),

    ('NC-2026-003',
     'Khảo sát thời gian chờ khám tại khoa Khám bệnh',
     'Đo lường thời gian chờ từng khâu và đề xuất giải pháp cải tiến quy trình tiếp nhận khám bệnh ngoại trú.',
     'QLCL', 'tranquocbao', 'QLCL-BV', 'Nghiên cứu cải tiến chất lượng', 'RMS-QI-2026-003',
     'not_required', NULL, NULL, NULL,
     '2026-03-01', '2026-08-31', '2026-03-01', NULL,
     'Xử lý thống kê / làm sạch số liệu', 75, 'in_progress', 'on_track', 'low', 'normal'),

    ('NC-2026-004',
     'Đặc điểm lâm sàng và cận lâm sàng của người bệnh viêm phổi cộng đồng nhập viện',
     'Phân tích hồ sơ bệnh án nhằm mô tả đặc điểm lâm sàng, xét nghiệm, hình ảnh học và kết quả điều trị.',
     'RESP', 'phamhoangnam', 'BV-NT', 'Nghiên cứu hồi cứu', 'RMS-CAP-2026-004',
     'approved', 'HĐĐĐ-2026-018', '2026-01-25', '2027-01-25',
     '2026-01-15', '2026-09-30', '2026-01-20', NULL,
     'Thu thập số liệu', 55, 'overdue', 'overdue', 'critical', 'urgent'),

    ('NC-2026-005',
     'Đánh giá mức độ hài lòng của người bệnh nội trú',
     'Khảo sát trải nghiệm người bệnh nội trú về chăm sóc, giao tiếp, vệ sinh, dinh dưỡng và thủ tục hành chính.',
     'CTXH', 'huynhthilan', 'BV-NT', 'Khảo sát hài lòng người bệnh', 'RMS-SAT-2026-005',
     'pending', NULL, NULL, NULL,
     '2026-04-01', '2026-11-15', NULL, NULL,
     'Viết đề cương', 15, 'at_risk', 'at_risk', 'medium', 'normal');

MERGE INTO research.research_projects AS tgt
USING (
    SELECT p.*,
           d.department_id AS lead_department_id,
           pi.user_id AS principal_investigator_id,
           s.sponsor_id
    FROM tmp_projects p
    LEFT JOIN ref.departments d ON d.department_code = p.department_code
    LEFT JOIN auth.users pi ON pi.username = p.pi_username
    LEFT JOIN research.sponsors s ON s.sponsor_code = p.sponsor_code
) AS src
    ON tgt.project_code = src.project_code
WHEN MATCHED THEN
    UPDATE SET project_title = src.project_title,
               project_description = src.project_description,
               lead_department_id = src.lead_department_id,
               principal_investigator_id = src.principal_investigator_id,
               sponsor_id = src.sponsor_id,
               research_type = src.research_type,
               protocol_number = src.protocol_number,
               ethics_status = src.ethics_status,
               ethics_approval_number = src.ethics_approval_number,
               ethics_approval_date = src.ethics_approval_date,
               ethics_expiry_date = src.ethics_expiry_date,
               planned_start_date = src.planned_start_date,
               planned_end_date = src.planned_end_date,
               actual_start_date = src.actual_start_date,
               actual_end_date = src.actual_end_date,
               current_phase_name = src.current_phase_name,
               progress_percent = src.progress_percent,
               project_status = src.project_status,
               health_status = src.health_status,
               risk_level = src.risk_level,
               priority_level = src.priority_level,
               is_active = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        project_code, project_title, project_description, lead_department_id,
        principal_investigator_id, sponsor_id, research_type, protocol_number,
        ethics_status, ethics_approval_number, ethics_approval_date, ethics_expiry_date,
        planned_start_date, planned_end_date, actual_start_date, actual_end_date,
        current_phase_name, progress_percent, project_status, health_status,
        risk_level, priority_level, is_active
    )
    VALUES (
        src.project_code, src.project_title, src.project_description, src.lead_department_id,
        src.principal_investigator_id, src.sponsor_id, src.research_type, src.protocol_number,
        src.ethics_status, src.ethics_approval_number, src.ethics_approval_date, src.ethics_expiry_date,
        src.planned_start_date, src.planned_end_date, src.actual_start_date, src.actual_end_date,
        src.current_phase_name, src.progress_percent, src.project_status, src.health_status,
        src.risk_level, src.priority_level, true
    );

/* =========================================================
   5. Project members
   ========================================================= */
DROP TABLE IF EXISTS tmp_members;
CREATE TEMP TABLE tmp_members (
    project_code   VARCHAR(100),
    username       VARCHAR(100),
    member_role    VARCHAR(100),
    responsibility VARCHAR(1000)
);

INSERT INTO tmp_members VALUES
    ('NC-2026-001', 'nguyenvanan', 'PI', 'Chủ nhiệm đề tài, phê duyệt chuyên môn và báo cáo cuối kỳ'),
    ('NC-2026-001', 'tranthimai', 'Coordinator', 'Điều phối hồ sơ, lịch họp hội đồng và tiến độ chung'),
    ('NC-2026-001', 'phamngochan', 'Member', 'Thu thập dữ liệu người bệnh ngoại trú'),
    ('NC-2026-001', 'vothithanh', 'Member', 'Làm sạch dữ liệu và phân tích thống kê'),
    ('NC-2026-002', 'leminhkhang', 'PI', 'Chủ nhiệm nghiên cứu can thiệp dinh dưỡng'),
    ('NC-2026-002', 'phamngochan', 'Coordinator', 'Theo dõi lịch tư vấn và nhập chỉ số HbA1c'),
    ('NC-2026-003', 'tranquocbao', 'PI', 'Chủ nhiệm đề tài cải tiến chất lượng'),
    ('NC-2026-003', 'vothithanh', 'Member', 'Phân tích thời gian chờ theo quy trình'),
    ('NC-2026-004', 'phamhoangnam', 'PI', 'Chủ nhiệm nghiên cứu hồi cứu viêm phổi cộng đồng'),
    ('NC-2026-004', 'nguyenthimylinh', 'Coordinator', 'Trích lục hồ sơ bệnh án và kiểm tra dữ liệu'),
    ('NC-2026-005', 'huynhthilan', 'PI', 'Chủ nhiệm khảo sát hài lòng người bệnh nội trú'),
    ('NC-2026-005', 'lethithuha', 'Coordinator', 'Tổ chức khảo sát tại các khoa nội trú');

INSERT INTO research.project_members (project_id, user_id, member_role, responsibility, created_by)
SELECT p.project_id, u.user_id, m.member_role, m.responsibility, admin.user_id
FROM tmp_members m
INNER JOIN research.research_projects p ON p.project_code = m.project_code
INNER JOIN auth.users u ON u.username = m.username
LEFT JOIN LATERAL (SELECT user_id FROM auth.users WHERE username = 'admin' LIMIT 1) admin ON true
WHERE NOT EXISTS (
    SELECT 1
    FROM research.project_members pm
    WHERE pm.project_id = p.project_id
      AND pm.user_id = u.user_id
      AND pm.member_role = m.member_role
);

/* =========================================================
   6. Modules / project phases
   Main project has realistic Gantt dates. Other projects have compact real data.
   ========================================================= */
DROP TABLE IF EXISTS tmp_phases;
CREATE TEMP TABLE tmp_phases (
    project_code        VARCHAR(100),
    phase_code           VARCHAR(100),
    sort_order            INTEGER,
    phase_name             VARCHAR(255),
    owner_username          VARCHAR(100),
    planned_start_date       DATE,
    planned_end_date          DATE,
    deadline_date               DATE,
    actual_start_date            DATE NULL,
    actual_end_date                DATE NULL,
    progress_percent                 NUMERIC(5,2),
    phase_status                      VARCHAR(100),
    notes                               TEXT
);

INSERT INTO tmp_phases VALUES
    /* NC-2026-001 */
    ('NC-2026-001', 'P01', 1, 'Viết đề cương', 'nguyenvanbinh', '2026-01-05', '2026-02-10', '2026-02-10', '2026-01-06', '2026-02-15', 100, 'completed', 'Hoàn thành trễ 5 ngày do bổ sung phần tính cỡ mẫu.'),
    ('NC-2026-001', 'P02', 2, 'Nộp đề cương', 'tranthimai', '2026-02-11', '2026-02-25', '2026-02-25', '2026-02-16', '2026-02-26', 100, 'completed', 'Hồ sơ nộp trễ do chờ chữ ký xác nhận của chủ nhiệm đề tài.'),
    ('NC-2026-001', 'P03', 3, 'Báo cáo đợi duyệt', 'leminhkhang', '2026-02-26', '2026-03-31', '2026-03-31', '2026-02-27', '2026-03-28', 100, 'completed', 'Hội đồng thống nhất thông qua với yêu cầu chỉnh sửa nhỏ.'),
    ('NC-2026-001', 'P04', 4, 'Chỉnh sửa đề cương', 'nguyenvanbinh', '2026-04-01', '2026-04-20', '2026-04-20', '2026-04-02', '2026-04-25', 100, 'completed', 'Bổ sung phiếu thu thập số liệu và tiêu chí loại trừ.'),
    ('NC-2026-001', 'P05', 5, 'Duyệt đề cương', 'hoidongdaoduc', '2026-04-21', '2026-05-15', '2026-05-15', '2026-04-26', '2026-05-14', 100, 'completed', 'Đề cương đã được phê duyệt triển khai.'),
    ('NC-2026-001', 'P06', 6, 'Thu thập số liệu', 'phamngochan', '2026-05-16', '2026-08-31', '2026-08-31', '2026-05-20', NULL, 58, 'at_risk', 'Số lượng bệnh nhân đạt tiêu chí thấp hơn dự kiến trong tháng 6.'),
    ('NC-2026-001', 'P07', 7, 'Xử lý thống kê / làm sạch số liệu', 'vothithanh', '2026-09-01', '2026-10-15', '2026-10-15', NULL, NULL, 0, 'not_started', 'Chờ hoàn tất thu thập số liệu.'),
    ('NC-2026-001', 'P08', 8, 'Báo cáo kết quả nghiên cứu', 'nguyenvanan', '2026-10-16', '2026-12-20', '2026-12-20', NULL, NULL, 0, 'not_started', 'Sẽ thực hiện sau khi chốt phân tích thống kê.'),

    /* NC-2026-002 */
    ('NC-2026-002', 'P01', 1, 'Viết đề cương', 'leminhkhang', '2026-02-01', '2026-02-25', '2026-02-25', '2026-02-03', '2026-02-24', 100, 'completed', 'Hoàn tất đề cương can thiệp tư vấn dinh dưỡng.'),
    ('NC-2026-002', 'P02', 2, 'Nộp đề cương', 'phamngochan', '2026-02-26', '2026-03-10', '2026-03-10', '2026-02-27', '2026-03-09', 100, 'completed', 'Nộp hồ sơ đúng hạn.'),
    ('NC-2026-002', 'P03', 3, 'Báo cáo đợi duyệt', 'leminhkhang', '2026-03-11', '2026-04-05', '2026-04-05', '2026-03-12', '2026-04-04', 100, 'completed', 'Hội đồng yêu cầu chuẩn hóa tài liệu tư vấn.'),
    ('NC-2026-002', 'P04', 4, 'Chỉnh sửa đề cương', 'phamngochan', '2026-04-06', '2026-04-20', '2026-04-20', '2026-04-07', '2026-04-19', 100, 'completed', 'Hoàn thiện checklist tư vấn.'),
    ('NC-2026-002', 'P05', 5, 'Duyệt đề cương', 'hoidongdaoduc', '2026-04-21', '2026-05-05', '2026-05-05', '2026-04-22', '2026-05-05', 100, 'completed', 'Đã phê duyệt triển khai.'),
    ('NC-2026-002', 'P06', 6, 'Thu thập số liệu', 'phamngochan', '2026-05-06', '2026-08-15', '2026-08-15', '2026-05-10', NULL, 45, 'in_progress', 'Đang thu thập chỉ số HbA1c và cân nặng.'),
    ('NC-2026-002', 'P07', 7, 'Xử lý thống kê / làm sạch số liệu', 'vothithanh', '2026-08-16', '2026-09-20', '2026-09-20', NULL, NULL, 0, 'not_started', 'Chờ đủ mẫu.'),
    ('NC-2026-002', 'P08', 8, 'Báo cáo kết quả nghiên cứu', 'leminhkhang', '2026-09-21', '2026-10-30', '2026-10-30', NULL, NULL, 0, 'not_started', 'Sẽ viết sau khi hoàn tất thống kê.'),

    /* NC-2026-003 */
    ('NC-2026-003', 'P01', 1, 'Viết đề cương', 'tranquocbao', '2026-03-01', '2026-03-15', '2026-03-15', '2026-03-01', '2026-03-14', 100, 'completed', 'Hoàn tất đề cương cải tiến chất lượng.'),
    ('NC-2026-003', 'P06', 6, 'Thu thập số liệu', 'tranquocbao', '2026-04-26', '2026-06-30', '2026-06-30', '2026-04-27', '2026-06-28', 100, 'completed', 'Đã thu thập dữ liệu theo khung giờ cao điểm.'),
    ('NC-2026-003', 'P07', 7, 'Xử lý thống kê / làm sạch số liệu', 'vothithanh', '2026-07-01', '2026-08-10', '2026-08-10', '2026-07-02', NULL, 55, 'in_progress', 'Đang làm sạch dữ liệu log thời gian.'),
    ('NC-2026-003', 'P08', 8, 'Báo cáo kết quả nghiên cứu', 'tranquocbao', '2026-08-11', '2026-08-31', '2026-08-31', NULL, NULL, 0, 'not_started', 'Chờ kết quả phân tích.'),

    /* NC-2026-004 */
    ('NC-2026-004', 'P01', 1, 'Viết đề cương', 'phamhoangnam', '2026-01-15', '2026-02-05', '2026-02-05', '2026-01-20', '2026-02-12', 100, 'completed', 'Hoàn thành trễ do bổ sung biến lâm sàng.'),
    ('NC-2026-004', 'P06', 6, 'Thu thập số liệu', 'nguyenthimylinh', '2026-05-01', '2026-07-31', '2026-07-31', '2026-05-08', NULL, 42, 'overdue', 'Trễ do thiếu hồ sơ bệnh án có phim X-quang đầy đủ.'),
    ('NC-2026-004', 'P07', 7, 'Xử lý thống kê / làm sạch số liệu', 'vothithanh', '2026-08-01', '2026-08-31', '2026-08-31', NULL, NULL, 0, 'not_started', 'Chưa đủ dữ liệu đầu vào.'),
    ('NC-2026-004', 'P08', 8, 'Báo cáo kết quả nghiên cứu', 'phamhoangnam', '2026-09-01', '2026-09-30', '2026-09-30', NULL, NULL, 0, 'not_started', 'Nguy cơ lùi lịch báo cáo.'),

    /* NC-2026-005 */
    ('NC-2026-005', 'P01', 1, 'Viết đề cương', 'lethithuha', '2026-04-01', '2026-04-30', '2026-04-30', '2026-04-05', NULL, 35, 'at_risk', 'Đề cương khảo sát chậm do cần thống nhất bộ câu hỏi.'),
    ('NC-2026-005', 'P02', 2, 'Nộp đề cương', 'lethithuha', '2026-05-01', '2026-05-15', '2026-05-15', NULL, NULL, 0, 'not_started', 'Chưa nộp.'),
    ('NC-2026-005', 'P06', 6, 'Thu thập số liệu', 'lethithuha', '2026-07-16', '2026-09-15', '2026-09-15', NULL, NULL, 0, 'not_started', 'Khảo sát bệnh nhân nội trú.'),
    ('NC-2026-005', 'P08', 8, 'Báo cáo kết quả nghiên cứu', 'huynhthilan', '2026-10-16', '2026-11-15', '2026-11-15', NULL, NULL, 0, 'not_started', 'Báo cáo cuối kỳ.');

MERGE INTO research.project_phases AS tgt
USING (
    SELECT p.project_id,
           ph.phase_code,
           ph.sort_order,
           ph.phase_name,
           ph.notes,
           u.user_id AS owner_user_id,
           ph.planned_start_date,
           ph.planned_end_date,
           ph.deadline_date,
           ph.actual_start_date,
           ph.actual_end_date,
           ph.progress_percent,
           ph.phase_status
    FROM tmp_phases ph
    INNER JOIN research.research_projects p ON p.project_code = ph.project_code
    LEFT JOIN auth.users u ON u.username = ph.owner_username
) AS src
    ON tgt.project_id = src.project_id AND tgt.phase_code = src.phase_code
WHEN MATCHED THEN
    UPDATE SET phase_name = src.phase_name,
               phase_description = 'Module quản lý tiến độ nghiên cứu: ' || src.phase_name,
               owner_user_id = src.owner_user_id,
               planned_start_date = src.planned_start_date,
               planned_end_date = src.planned_end_date,
               deadline_date = src.deadline_date,
               actual_start_date = src.actual_start_date,
               actual_end_date = src.actual_end_date,
               progress_percent = src.progress_percent,
               phase_status = src.phase_status,
               sort_order = src.sort_order,
               notes = src.notes,
               is_active = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        project_id, phase_code, phase_name, phase_description, owner_user_id,
        planned_start_date, planned_end_date, deadline_date, actual_start_date,
        actual_end_date, progress_percent, phase_status, sort_order, notes, is_active
    )
    VALUES (
        src.project_id, src.phase_code, src.phase_name,
        'Module quản lý tiến độ nghiên cứu: ' || src.phase_name, src.owner_user_id,
        src.planned_start_date, src.planned_end_date, src.deadline_date,
        src.actual_start_date, src.actual_end_date, src.progress_percent,
        src.phase_status, src.sort_order, src.notes, true
    );

/* =========================================================
   7. Detailed milestones for NC-2026-001
   ========================================================= */
DROP TABLE IF EXISTS tmp_milestones;
CREATE TEMP TABLE tmp_milestones (
    project_code       VARCHAR(100),
    phase_code          VARCHAR(100),
    milestone_code        VARCHAR(100),
    milestone_name          VARCHAR(255),
    owner_username             VARCHAR(100),
    due_date                     DATE,
    completed_date                 DATE NULL,
    milestone_status                 VARCHAR(100),
    priority_level                     VARCHAR(50),
    notes                                TEXT
);

INSERT INTO tmp_milestones VALUES
    ('NC-2026-001', 'P01', 'P01-M01', 'Xác định câu hỏi nghiên cứu', 'nguyenvanbinh', '2026-01-10', '2026-01-09', 'completed', 'normal', 'Câu hỏi nghiên cứu được PI thống nhất.'),
    ('NC-2026-001', 'P01', 'P01-M02', 'Tổng quan tài liệu', 'nguyenvanbinh', '2026-01-20', '2026-01-22', 'completed', 'high', 'Hoàn thành trễ 2 ngày do bổ sung hướng dẫn điều trị mới.'),
    ('NC-2026-001', 'P01', 'P01-M03', 'Xây dựng mục tiêu và biến số nghiên cứu', 'nguyenvanbinh', '2026-01-28', '2026-01-29', 'completed', 'normal', 'Bổ sung biến tuân thủ dùng thuốc.'),
    ('NC-2026-001', 'P01', 'P01-M04', 'Tính cỡ mẫu và phương pháp chọn mẫu', 'nguyenvanbinh', '2026-02-05', '2026-02-12', 'completed', 'high', 'Cần hiệu chỉnh công thức cỡ mẫu.'),
    ('NC-2026-001', 'P01', 'P01-M05', 'Hoàn thiện bản đề cương lần cuối', 'nguyenvanbinh', '2026-02-10', '2026-02-15', 'completed', 'high', 'Bản cuối đã gửi PI.'),

    ('NC-2026-001', 'P02', 'P02-M01', 'Chuẩn bị hồ sơ nộp đề cương', 'tranthimai', '2026-02-15', '2026-02-16', 'completed', 'normal', 'Chuẩn bị đề cương, CV nhóm nghiên cứu và phiếu thu thập số liệu.'),
    ('NC-2026-001', 'P02', 'P02-M02', 'Kiểm tra đầy đủ chữ ký xác nhận', 'tranthimai', '2026-02-20', '2026-02-24', 'completed', 'high', 'Phát sinh: Cần bổ sung chữ ký xác nhận của khoa.'),
    ('NC-2026-001', 'P02', 'P02-M03', 'Nộp hồ sơ cho Phòng Quản lý Nghiên cứu', 'tranthimai', '2026-02-25', '2026-02-26', 'completed', 'high', 'Nộp trễ 1 ngày.'),
    ('NC-2026-001', 'P02', 'P02-M04', 'Nhận mã hồ sơ nghiên cứu', 'tranthimai', '2026-02-25', '2026-02-26', 'completed', 'normal', 'Đã nhận mã hồ sơ nội bộ.'),

    ('NC-2026-001', 'P03', 'P03-M01', 'Xếp lịch báo cáo hội đồng', 'leminhkhang', '2026-03-05', '2026-03-04', 'completed', 'normal', 'Đã chốt lịch họp.'),
    ('NC-2026-001', 'P03', 'P03-M02', 'Chuẩn bị slide báo cáo đề cương', 'leminhkhang', '2026-03-15', '2026-03-14', 'completed', 'normal', 'Slide đã được PI duyệt.'),
    ('NC-2026-001', 'P03', 'P03-M03', 'Báo cáo trước hội đồng', 'leminhkhang', '2026-03-22', '2026-03-22', 'completed', 'high', 'Hoàn tất phiên báo cáo.'),
    ('NC-2026-001', 'P03', 'P03-M04', 'Tổng hợp biên bản góp ý', 'leminhkhang', '2026-03-31', '2026-03-28', 'completed', 'normal', 'Biên bản yêu cầu chỉnh sửa nhỏ.'),

    ('NC-2026-001', 'P04', 'P04-M01', 'Phân tích góp ý của hội đồng', 'nguyenvanbinh', '2026-04-05', '2026-04-05', 'completed', 'normal', 'Phân loại góp ý theo nội dung.'),
    ('NC-2026-001', 'P04', 'P04-M02', 'Cập nhật tiêu chí chọn mẫu và loại trừ', 'nguyenvanbinh', '2026-04-10', '2026-04-12', 'completed', 'high', 'Cần làm rõ tiêu chí bệnh đồng mắc.'),
    ('NC-2026-001', 'P04', 'P04-M03', 'Bổ sung phiếu thu thập số liệu', 'nguyenvanbinh', '2026-04-15', '2026-04-18', 'completed', 'normal', 'Bổ sung trường thuốc điều trị.'),
    ('NC-2026-001', 'P04', 'P04-M04', 'Gửi lại bản chỉnh sửa', 'nguyenvanbinh', '2026-04-20', '2026-04-25', 'completed', 'high', 'Gửi trễ do chờ PI rà soát.'),

    ('NC-2026-001', 'P05', 'P05-M01', 'Nhận quyết định phê duyệt', 'hoidongdaoduc', '2026-04-30', '2026-04-29', 'completed', 'urgent', 'Đã nhận quyết định phê duyệt.'),
    ('NC-2026-001', 'P05', 'P05-M02', 'Lưu hồ sơ phê duyệt', 'hoidongdaoduc', '2026-05-05', '2026-05-04', 'completed', 'normal', 'Đã lưu hồ sơ tại phòng nghiên cứu.'),
    ('NC-2026-001', 'P05', 'P05-M03', 'Thông báo triển khai cho khoa', 'hoidongdaoduc', '2026-05-15', '2026-05-14', 'completed', 'normal', 'Khoa Khám bệnh đã nhận thông báo.'),

    ('NC-2026-001', 'P06', 'P06-M01', 'Chuẩn bị danh sách người bệnh đủ tiêu chuẩn', 'phamngochan', '2026-05-31', '2026-05-30', 'completed', 'normal', 'Danh sách ban đầu từ phòng khám tăng huyết áp.'),
    ('NC-2026-001', 'P06', 'P06-M02', 'Kiểm tra hồ sơ bệnh án ngoại trú', 'phamngochan', '2026-06-30', NULL, 'in_progress', 'high', 'Phát sinh: Thiếu thông tin trong hồ sơ bệnh án.'),
    ('NC-2026-001', 'P06', 'P06-M03', 'Ghi nhận chỉ số huyết áp và thuốc đang sử dụng', 'phamngochan', '2026-07-31', NULL, 'in_progress', 'high', 'Phát sinh: Người bệnh tái khám không đúng hẹn.'),
    ('NC-2026-001', 'P06', 'P06-M04', 'Nhập dữ liệu vào biểu mẫu nghiên cứu', 'phamngochan', '2026-08-15', NULL, 'not_started', 'normal', 'Chờ đủ hồ sơ trong tháng 7.'),
    ('NC-2026-001', 'P06', 'P06-M05', 'Kiểm tra thiếu dữ liệu định kỳ', 'phamngochan', '2026-08-31', NULL, 'not_started', 'high', 'Sẽ kiểm tra sau mỗi đợt nhập dữ liệu.'),

    ('NC-2026-001', 'P07', 'P07-M01', 'Nhận dữ liệu thô từ nhóm thu thập', 'vothithanh', '2026-09-05', NULL, 'not_started', 'normal', 'Chờ hoàn tất thu thập số liệu.'),
    ('NC-2026-001', 'P07', 'P07-M02', 'Kiểm tra missing data', 'vothithanh', '2026-09-15', NULL, 'not_started', 'high', 'Dự kiến kiểm tra biến huyết áp và thuốc.'),
    ('NC-2026-001', 'P07', 'P07-M03', 'Làm sạch dữ liệu', 'vothithanh', '2026-09-30', NULL, 'not_started', 'high', 'Chuẩn hóa mã hóa biến.'),
    ('NC-2026-001', 'P07', 'P07-M04', 'Chốt dataset phân tích', 'vothithanh', '2026-10-10', NULL, 'not_started', 'urgent', 'Dataset khóa trước khi chạy thống kê.'),
    ('NC-2026-001', 'P07', 'P07-M05', 'Chạy thống kê mô tả và phân tích liên quan', 'vothithanh', '2026-10-15', NULL, 'not_started', 'urgent', 'Phân tích theo kế hoạch thống kê.'),

    ('NC-2026-001', 'P08', 'P08-M01', 'Viết báo cáo kết quả nghiên cứu', 'nguyenvanan', '2026-11-10', NULL, 'not_started', 'normal', 'Chưa bắt đầu.'),
    ('NC-2026-001', 'P08', 'P08-M02', 'Review báo cáo với PI và khoa', 'nguyenvanan', '2026-11-25', NULL, 'not_started', 'high', 'Chờ bản báo cáo đầu tiên.'),
    ('NC-2026-001', 'P08', 'P08-M03', 'Hoàn thiện báo cáo cuối cùng', 'nguyenvanan', '2026-12-10', NULL, 'not_started', 'urgent', 'Hoàn thiện trước hạn nộp.'),
    ('NC-2026-001', 'P08', 'P08-M04', 'Nộp báo cáo kết quả nghiên cứu', 'nguyenvanan', '2026-12-20', NULL, 'not_started', 'urgent', 'Deadline báo cáo cuối kỳ.');

MERGE INTO research.project_milestones AS tgt
USING (
    SELECT p.project_id,
           ph.phase_id,
           m.milestone_code,
           m.milestone_name,
           m.notes,
           m.due_date,
           m.completed_date,
           u.user_id AS owner_user_id,
           m.milestone_status,
           m.priority_level
    FROM tmp_milestones m
    INNER JOIN research.research_projects p ON p.project_code = m.project_code
    INNER JOIN research.project_phases ph ON ph.project_id = p.project_id AND ph.phase_code = m.phase_code
    LEFT JOIN auth.users u ON u.username = m.owner_username
) AS src
    ON tgt.project_id = src.project_id AND tgt.milestone_code = src.milestone_code
WHEN MATCHED THEN
    UPDATE SET phase_id = src.phase_id,
               milestone_name = src.milestone_name,
               milestone_description = 'Mốc tiến độ thuộc module nghiên cứu',
               due_date = src.due_date,
               completed_date = src.completed_date,
               owner_user_id = src.owner_user_id,
               milestone_status = src.milestone_status,
               priority_level = src.priority_level,
               notes = src.notes,
               is_active = true,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        project_id, phase_id, milestone_code, milestone_name,
        milestone_description, due_date, completed_date, owner_user_id,
        milestone_status, priority_level, notes, is_active
    )
    VALUES (
        src.project_id, src.phase_id, src.milestone_code, src.milestone_name,
        'Mốc tiến độ thuộc module nghiên cứu', src.due_date, src.completed_date,
        src.owner_user_id, src.milestone_status, src.priority_level, src.notes, true
    );

/* =========================================================
   8. Deadlines for modules and milestones
   ========================================================= */
MERGE INTO research.project_deadlines AS tgt
USING (
    SELECT
        p.project_id,
        ph.phase_id,
        CAST(NULL AS BIGINT) AS milestone_id,
        'phase_due' AS deadline_type,
        'Hạn chót module: ' || ph.phase_name AS deadline_title,
        ph.notes AS deadline_description,
        ph.deadline_date AS due_date,
        CASE WHEN ph.phase_status = 'completed' THEN ph.actual_end_date::timestamptz ELSE NULL END AS completed_at,
        ph.owner_user_id AS responsible_user_id,
        CASE WHEN ph.phase_status IN ('overdue', 'at_risk') THEN 'high' ELSE 'normal' END AS priority_level,
        CASE
            WHEN ph.phase_status = 'completed' THEN 'completed'
            WHEN ph.phase_status = 'overdue' THEN 'overdue'
            ELSE 'open'
        END AS deadline_status
    FROM research.project_phases ph
    INNER JOIN research.research_projects p ON p.project_id = ph.project_id
    WHERE p.project_code LIKE 'NC-2026-%'
      AND ph.deadline_date IS NOT NULL
) AS src
    ON tgt.project_id = src.project_id
   AND tgt.phase_id = src.phase_id
   AND tgt.milestone_id IS NULL
   AND tgt.deadline_type = src.deadline_type
WHEN MATCHED THEN
    UPDATE SET deadline_title = src.deadline_title,
               deadline_description = src.deadline_description,
               due_date = src.due_date,
               completed_at = src.completed_at,
               responsible_user_id = src.responsible_user_id,
               priority_level = src.priority_level,
               deadline_status = src.deadline_status,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        project_id, phase_id, milestone_id, deadline_type, deadline_title,
        deadline_description, due_date, completed_at, responsible_user_id,
        priority_level, deadline_status
    )
    VALUES (
        src.project_id, src.phase_id, NULL, src.deadline_type, src.deadline_title,
        src.deadline_description, src.due_date, src.completed_at, src.responsible_user_id,
        src.priority_level, src.deadline_status
    );

MERGE INTO research.project_deadlines AS tgt
USING (
    SELECT
        p.project_id,
        m.phase_id,
        m.milestone_id,
        'milestone_due' AS deadline_type,
        'Hạn chót milestone: ' || m.milestone_name AS deadline_title,
        m.notes AS deadline_description,
        m.due_date,
        m.completed_date::timestamptz AS completed_at,
        m.owner_user_id AS responsible_user_id,
        m.priority_level,
        CASE
            WHEN m.milestone_status = 'completed' THEN 'completed'
            WHEN m.milestone_status = 'overdue' THEN 'overdue'
            ELSE 'open'
        END AS deadline_status
    FROM research.project_milestones m
    INNER JOIN research.research_projects p ON p.project_id = m.project_id
    WHERE p.project_code LIKE 'NC-2026-%'
) AS src
    ON tgt.project_id = src.project_id
   AND tgt.milestone_id = src.milestone_id
   AND tgt.deadline_type = src.deadline_type
WHEN MATCHED THEN
    UPDATE SET deadline_title = src.deadline_title,
               deadline_description = src.deadline_description,
               due_date = src.due_date,
               completed_at = src.completed_at,
               responsible_user_id = src.responsible_user_id,
               priority_level = src.priority_level,
               deadline_status = src.deadline_status,
               updated_at = now()
WHEN NOT MATCHED THEN
    INSERT (
        project_id, phase_id, milestone_id, deadline_type, deadline_title,
        deadline_description, due_date, completed_at, responsible_user_id,
        priority_level, deadline_status
    )
    VALUES (
        src.project_id, src.phase_id, src.milestone_id, src.deadline_type,
        src.deadline_title, src.deadline_description, src.due_date,
        src.completed_at, src.responsible_user_id, src.priority_level,
        src.deadline_status
    );

/* =========================================================
   9. Documents and notifications
   ========================================================= */
DROP TABLE IF EXISTS tmp_docs;
CREATE TEMP TABLE tmp_docs (
    project_code          VARCHAR(100),
    phase_code             VARCHAR(100) NULL,
    document_type            VARCHAR(100),
    document_title             VARCHAR(255),
    file_name                    VARCHAR(255),
    version_label                  VARCHAR(50),
    uploaded_by_username             VARCHAR(100)
);

INSERT INTO tmp_docs VALUES
    ('NC-2026-001', 'P01', 'protocol', 'Đề cương nghiên cứu đã phê duyệt', 'NC-2026-001_DeCuong_v1.3.pdf', 'v1.3', 'nguyenvanan'),
    ('NC-2026-001', 'P05', 'ethics', 'Quyết định phê duyệt Hội đồng Đạo đức', 'NC-2026-001_HDDD_2026-015.pdf', 'final', 'hoidongdaoduc'),
    ('NC-2026-001', 'P06', 'attachment', 'Biểu mẫu thu thập số liệu tăng huyết áp', 'NC-2026-001_CRF.xlsx', 'v2.0', 'phamngochan'),
    ('NC-2026-002', 'P01', 'protocol', 'Đề cương can thiệp tư vấn dinh dưỡng', 'NC-2026-002_DeCuong.pdf', 'v1.0', 'leminhkhang'),
    ('NC-2026-003', 'P06', 'attachment', 'Biểu mẫu ghi nhận thời gian chờ khám', 'NC-2026-003_TimeLog.xlsx', 'v1.1', 'tranquocbao'),
    ('NC-2026-004', 'P06', 'attachment', 'Danh sách hồ sơ bệnh án cần trích lục', 'NC-2026-004_HSBA_List.xlsx', 'v1.0', 'nguyenthimylinh');

INSERT INTO research.project_documents (
    project_id, phase_id, document_type, document_title,
    file_name, file_url, file_size_bytes, mime_type, version_label, uploaded_by
)
SELECT
    p.project_id,
    ph.phase_id,
    d.document_type,
    d.document_title,
    d.file_name,
    '/demo-files/research/' || d.file_name,
    524288,
    CASE WHEN d.file_name LIKE '%.xlsx' THEN 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
         ELSE 'application/pdf' END,
    d.version_label,
    uploader.user_id
FROM tmp_docs d
INNER JOIN research.research_projects p ON p.project_code = d.project_code
LEFT JOIN research.project_phases ph ON ph.project_id = p.project_id AND ph.phase_code = d.phase_code
LEFT JOIN auth.users uploader ON uploader.username = d.uploaded_by_username
WHERE NOT EXISTS (
    SELECT 1 FROM research.project_documents existing
    WHERE existing.project_id = p.project_id
      AND existing.document_title = d.document_title
      AND COALESCE(existing.file_name, '') = COALESCE(d.file_name, '')
);

DROP TABLE IF EXISTS tmp_notifications;
CREATE TEMP TABLE tmp_notifications (
    username             VARCHAR(100),
    notification_type      VARCHAR(100),
    category                 VARCHAR(100),
    title                      VARCHAR(500),
    message                     TEXT,
    priority_level                VARCHAR(50),
    related_entity_code             VARCHAR(100)
);

INSERT INTO tmp_notifications VALUES
    ('nguyenvanan', 'project_at_risk', 'research', 'Đề tài có nguy cơ chậm tiến độ', 'NC-2026-001 đang có nguy cơ do số lượng người bệnh đủ tiêu chuẩn thấp hơn dự kiến.', 'high', 'NC-2026-001'),
    ('phamngochan', 'milestone_issue', 'deadline', 'Cần kiểm tra thiếu dữ liệu hồ sơ bệnh án', 'Milestone kiểm tra hồ sơ ngoại trú có ghi nhận thiếu thông tin trong hồ sơ bệnh án.', 'high', 'NC-2026-001'),
    ('phamhoangnam', 'project_overdue', 'research', 'Đề tài viêm phổi cộng đồng đang trễ hạn', 'NC-2026-004 trễ tại module thu thập số liệu do thiếu hồ sơ có phim X-quang đầy đủ.', 'urgent', 'NC-2026-004'),
    ('huynhthilan', 'ethics_pending', 'ethics', 'Hồ sơ khảo sát hài lòng chưa được duyệt', 'NC-2026-005 đang chờ hoàn tất đề cương và nộp hội đồng.', 'medium', 'NC-2026-005');

INSERT INTO notify.notifications (
    notification_type, category, title, message, priority_level,
    related_entity_type, related_entity_id, related_entity_code,
    action_url, suggested_action
)
SELECT
    n.notification_type,
    n.category,
    n.title,
    n.message,
    n.priority_level,
    'research_project',
    p.project_id,
    p.project_code,
    '/nghien-cuu/' || p.project_id::text,
    'Xem chi tiết nghiên cứu'
FROM tmp_notifications n
INNER JOIN research.research_projects p ON p.project_code = n.related_entity_code
WHERE NOT EXISTS (
    SELECT 1 FROM notify.notifications existing
    WHERE existing.related_entity_type = 'research_project'
      AND existing.related_entity_id = p.project_id
      AND existing.title = n.title
      AND existing.is_deleted = false
);

INSERT INTO notify.notification_recipients (
    notification_id, user_id, delivered_in_app_at, email_send_status
)
SELECT noti.notification_id, u.user_id, now(), 'pending'
FROM tmp_notifications n
INNER JOIN auth.users u ON u.username = n.username
INNER JOIN research.research_projects p ON p.project_code = n.related_entity_code
INNER JOIN notify.notifications noti
    ON noti.related_entity_type = 'research_project'
   AND noti.related_entity_id = p.project_id
   AND noti.title = n.title
WHERE NOT EXISTS (
    SELECT 1 FROM notify.notification_recipients nr
    WHERE nr.notification_id = noti.notification_id AND nr.user_id = u.user_id
);

INSERT INTO audit.activity_logs (
    user_id, module_code, action_type, entity_type, entity_id, entity_code,
    action_summary, status
)
SELECT admin.user_id, 'research_project', 'seed', 'research_project', p.project_id, p.project_code,
       'Seed dữ liệu demo bệnh viện cho đề tài ' || p.project_code, 'success'
FROM research.research_projects p
LEFT JOIN LATERAL (SELECT user_id FROM auth.users WHERE username = 'admin' LIMIT 1) admin ON true
WHERE p.project_code LIKE 'NC-2026-%'
  AND NOT EXISTS (
      SELECT 1 FROM audit.activity_logs l
      WHERE l.entity_type = 'research_project'
        AND l.entity_id = p.project_id
        AND l.action_type = 'seed'
  );

COMMIT;

/* =========================================================
   10. Verification queries
   ========================================================= */
SELECT 'research_projects' AS object_name, COUNT(*) AS total
FROM research.research_projects
WHERE project_code LIKE 'NC-2026-%'
UNION ALL
SELECT 'project_phases', COUNT(*)
FROM research.project_phases ph
INNER JOIN research.research_projects p ON p.project_id = ph.project_id
WHERE p.project_code LIKE 'NC-2026-%'
UNION ALL
SELECT 'project_milestones', COUNT(*)
FROM research.project_milestones m
INNER JOIN research.research_projects p ON p.project_id = m.project_id
WHERE p.project_code LIKE 'NC-2026-%'
UNION ALL
SELECT 'project_deadlines', COUNT(*)
FROM research.project_deadlines d
INNER JOIN research.research_projects p ON p.project_id = d.project_id
WHERE p.project_code LIKE 'NC-2026-%';

SELECT
    p.project_code,
    p.project_title,
    d.department_name,
    pi.full_name AS principal_investigator,
    p.progress_percent,
    p.project_status,
    p.health_status,
    p.risk_level,
    COUNT(DISTINCT ph.phase_id) AS total_modules,
    COUNT(DISTINCT m.milestone_id) AS total_milestones
FROM research.research_projects p
LEFT JOIN ref.departments d ON d.department_id = p.lead_department_id
LEFT JOIN auth.users pi ON pi.user_id = p.principal_investigator_id
LEFT JOIN research.project_phases ph ON ph.project_id = p.project_id AND ph.deleted_at IS NULL
LEFT JOIN research.project_milestones m ON m.project_id = p.project_id AND m.deleted_at IS NULL
WHERE p.project_code LIKE 'NC-2026-%'
GROUP BY
    p.project_code, p.project_title, d.department_name, pi.full_name,
    p.progress_percent, p.project_status, p.health_status, p.risk_level
ORDER BY p.project_code;

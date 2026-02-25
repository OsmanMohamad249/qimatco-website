import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import InnerHeader from "../components/InnerHeader";
import Footer from "../components/Footer";

const Team = () => {
  const { t, language } = useLanguage();
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [titles, setTitles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const loc = (val) => {
    if (!val) return "";
    if (typeof val === "string") return val;
    return val[language] || val.ar || val.en || "";
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [depSnap, secSnap, titleSnap, empSnap] = await Promise.all([
          getDocs(collection(db, "team_departments")),
          getDocs(collection(db, "team_sections")),
          getDocs(collection(db, "team_titles")),
          getDocs(collection(db, "team_employees")),
        ]);
        setDepartments(depSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSections(secSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTitles(titleSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEmployees(empSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // Ignore for now.
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const deptById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);
  const sectionById = useMemo(() => Object.fromEntries(sections.map((s) => [s.id, s])), [sections]);
  const titleById = useMemo(() => Object.fromEntries(titles.map((t) => [t.id, t])), [titles]);

  const employeesByManager = useMemo(() => {
    const map = {};
    // 1. Map valid IDs to prevent orphaned children from disappearing
    const validIds = new Set(employees.map((e) => e.id));

    // 2. Rank dictionary to enforce agreed hierarchy
    const LEVEL_RANK = { top: 1, executive: 2, management: 3, staff: 4 };

    const getRank = (emp) => {
      const title = titleById[emp.titleId];
      return title && title.level ? (LEVEL_RANK[title.level] || 5) : 5;
    };

    // 3. Build the Tree
    employees.forEach((emp) => {
      // CRITICAL FIX: If managerId is missing or invalid, force them to "root" so they don't vanish
      const isInvalidManager = !emp.managerId || !validIds.has(emp.managerId);
      const key = isInvalidManager ? "root" : emp.managerId;
      if (!map[key]) map[key] = [];
      map[key].push(emp);
    });

    // 4. Sort every branch by Management Level
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => getRank(a) - getRank(b));
    });

    return map;
  }, [employees, titleById]);

  const resolveDeptName = (emp) => {
    const title = titleById[emp.titleId];
    const section = title ? sectionById[title.sectionId] : null;
    const dept = section ? deptById[section.departmentId] : null;
    return dept ? loc(dept.name) : (t('nav_team') || "Team");
  };

  const resolveSectionName = (emp) => {
    const title = titleById[emp.titleId];
    const section = title ? sectionById[title.sectionId] : null;
    return section ? loc(section.name) : (t('about_title') || "Department");
  };

  const resolveTitleName = (emp) => {
    const title = titleById[emp.titleId];
    return title ? loc(title.title) : (t('career_form_name') || "Member");
  };

  const renderNode = (emp) => {
    const children = employeesByManager[emp.id] || [];
    return (
      <li key={emp.id} className="org-node">
        <div className="org-card" onClick={() => setSelectedEmployee(emp)}>
          {emp.imageUrl ? (
            <img src={emp.imageUrl} alt={loc(emp.name)} className="org-avatar" />
          ) : (
            <div className="org-avatar org-avatar-placeholder">
              <i className="bi bi-person-fill"></i>
            </div>
          )}
          <div className="org-info">
            <div className="org-name">{loc(emp.name)}</div>
            <div className="org-role">{resolveTitleName(emp)}</div>
          </div>
        </div>
        {children.length > 0 && (
          <ul className="org-children">
            {children.map((child) => renderNode(child))}
          </ul>
        )}
      </li>
    );
  };

  const rootEmployees = employeesByManager.root || [];

  return (
    <>
      <Helmet>
        <title>{t("team_title")} | Qimmah AlAibtikar</title>
      </Helmet>
      <InnerHeader />

      <main id="main" className="py-5" style={{ backgroundColor: "var(--bg-main)" }}>
        <div className="container">
          <div className="section-header text-center mb-4">
            <h2 style={{ color: "var(--primary-color)", fontWeight: 800 }}>{t("team_title")}</h2>
            <p className="text-muted">{t("team_subtitle")}</p>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : rootEmployees.length === 0 ? (
            <div className="alert alert-info text-center">{t("team_no_employees")}</div>
          ) : (
            <div className="org-tree-wrapper">
              <ul className="org-tree">
                {rootEmployees.map((emp) => renderNode(emp))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {selectedEmployee && (
        <div className="team-modal-backdrop" onClick={() => setSelectedEmployee(null)}>
          <div className="team-modal" onClick={(e) => e.stopPropagation()}>
            <div className="team-modal-header">
              <h5>{loc(selectedEmployee.name)}</h5>
              <button className="btn-close" onClick={() => setSelectedEmployee(null)}></button>
            </div>
            <div className="team-modal-body">
              <div className="d-flex flex-column align-items-center text-center gap-3 mb-4">
                {/* Image or Placeholder container */}
                <div className="avatar-wrapper">
                  {selectedEmployee.imageUrl ? (
                    <img
                      src={selectedEmployee.imageUrl}
                      alt={loc(selectedEmployee.name)}
                      className="img-fluid rounded-circle shadow-sm"
                      style={{ width: '150px', height: '150px', objectFit: 'cover', border: '4px solid var(--primary-color)' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto"
                      style={{ width: '150px', height: '150px', backgroundColor: '#e9ecef', border: '4px solid var(--primary-color)' }}
                    >
                      <i className="bi bi-person-fill text-secondary" style={{ fontSize: '4rem' }}></i>
                    </div>
                  )}
                </div>

                {/* Employee Basic Info */}
                <div className="flex-grow-1 w-100">
                  <div className="mb-2"><strong>{t("team_job_title")}:</strong> {resolveTitleName(selectedEmployee)}</div>
                  <div className="mb-2"><strong>{t("team_department")}:</strong> {resolveDeptName(selectedEmployee)}</div>
                  <div className="mb-2"><strong>{t("team_section")}:</strong> {resolveSectionName(selectedEmployee)}</div>
                  {selectedEmployee.managerId && (
                    <div className="mb-2"><strong>{t("team_direct_manager")}:</strong> {loc((employees.find((e) => e.id === selectedEmployee.managerId) || {}).name)}</div>
                  )}
                </div>
              </div>

              {selectedEmployee.bio && (
                <div className="mt-3">
                  <h6>{t("team_bio")}</h6>
                  <p className="text-muted mb-0">{loc(selectedEmployee.bio)}</p>
                </div>
              )}

              {selectedEmployee.responsibilities && (
                <div className="mt-3">
                  <h6>{t("team_responsibilities")}</h6>
                  <p className="text-muted mb-0">{loc(selectedEmployee.responsibilities)}</p>
                </div>
              )}

              {selectedEmployee.cvUrl && (
                <div className="mt-4">
                  <a className="btn btn-primary" href={selectedEmployee.cvUrl} target="_blank" rel="noopener noreferrer">
                    {t("team_download_cv")}
                  </a>
                </div>
              )}
            </div>
            <div className="team-modal-footer">
              <button className="btn btn-outline-secondary" onClick={() => setSelectedEmployee(null)}>{t("team_close")}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Team;

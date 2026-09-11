import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Network,
  ChevronDown,
  ExternalLink,
  Shield,
  User,
  Building2,
  Cpu,
  Layers,
  Lock,
  Globe,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SitemapLeaf {
  id: string;
  nameKey: string;
  route: string;
  descKey: string;
  role: 'PUBLIC' | 'CITIZEN' | 'OFFICIAL' | 'ADMIN' | 'COMING_SOON';
  implemented: boolean;
}

interface SitemapBranch {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  descKey: string;
  badgeKey: string;
  color: string;
  children: SitemapLeaf[];
}

const SITEMAP_DATA: SitemapBranch[] = [
  {
    id: 'public',
    titleKey: 'sitemapNodes.publicTitle',
    icon: Globe,
    descKey: 'sitemapNodes.publicDesc',
    badgeKey: 'sitemapNodes.badgePublic',
    color: '#3A6EA5',
    children: [
      {
        id: 'home',
        nameKey: 'sitemapNodes.leafHome',
        route: '/',
        descKey: 'sitemapNodes.leafHomeDesc',
        role: 'PUBLIC',
        implemented: true,
      },
      {
        id: 'services',
        nameKey: 'sitemapNodes.leafServices',
        route: '/services',
        descKey: 'sitemapNodes.leafServicesDesc',
        role: 'PUBLIC',
        implemented: true,
      },
      {
        id: 'about',
        nameKey: 'sitemapNodes.leafAbout',
        route: '/about',
        descKey: 'sitemapNodes.leafAboutDesc',
        role: 'PUBLIC',
        implemented: true,
      },
    ],
  },
  {
    id: 'access',
    titleKey: 'sitemapNodes.accessTitle',
    icon: Lock,
    descKey: 'sitemapNodes.accessDesc',
    badgeKey: 'sitemapNodes.badgeSecurity',
    color: '#004E98',
    children: [
      {
        id: 'access-page',
        nameKey: 'sitemapNodes.leafAccess',
        route: '/access',
        descKey: 'sitemapNodes.leafAccessDesc',
        role: 'PUBLIC',
        implemented: true,
      },
      {
        id: 'login-page',
        nameKey: 'sitemapNodes.leafLogin',
        route: '/login',
        descKey: 'sitemapNodes.leafLoginDesc',
        role: 'PUBLIC',
        implemented: true,
      },
    ],
  },
  {
    id: 'citizen',
    titleKey: 'sitemapNodes.citizenTitle',
    icon: User,
    descKey: 'sitemapNodes.citizenDesc',
    badgeKey: 'sitemapNodes.badgeCitizen',
    color: '#004E98',
    children: [
      {
        id: 'my-apps',
        nameKey: 'sitemapNodes.leafMyApps',
        route: '/my-applications',
        descKey: 'sitemapNodes.leafMyAppsDesc',
        role: 'CITIZEN',
        implemented: true,
      },
      {
        id: 'apply-page',
        nameKey: 'sitemapNodes.leafApply',
        route: '/apply',
        descKey: 'sitemapNodes.leafApplyDesc',
        role: 'CITIZEN',
        implemented: true,
      },
      {
        id: 'status-page',
        nameKey: 'sitemapNodes.leafStatus',
        route: '/applications/APP-SIH-2026-001/status',
        descKey: 'sitemapNodes.leafStatusDesc',
        role: 'CITIZEN',
        implemented: true,
      },
    ],
  },
  {
    id: 'official',
    titleKey: 'sitemapNodes.officialTitle',
    icon: Building2,
    descKey: 'sitemapNodes.officialDesc',
    badgeKey: 'sitemapNodes.badgeOfficial',
    color: '#3A6EA5',
    children: [
      {
        id: 'case-queue',
        nameKey: 'sitemapNodes.leafQueue',
        route: '/official/queue',
        descKey: 'sitemapNodes.leafQueueDesc',
        role: 'OFFICIAL',
        implemented: true,
      },
      {
        id: 'case-detail',
        nameKey: 'sitemapNodes.leafCaseDetail',
        route: '/official/case/APP-SIH-2026-001',
        descKey: 'sitemapNodes.leafCaseDetailDesc',
        role: 'OFFICIAL',
        implemented: true,
      },
      {
        id: 'operations-dash',
        nameKey: 'sitemapNodes.leafOperations',
        route: '/official/operations',
        descKey: 'sitemapNodes.leafOperationsDesc',
        role: 'OFFICIAL',
        implemented: true,
      },
    ],
  },
  {
    id: 'admin',
    titleKey: 'sitemapNodes.adminTitle',
    icon: Cpu,
    descKey: 'sitemapNodes.adminDesc',
    badgeKey: 'sitemapNodes.badgeAdmin',
    color: '#004E98',
    children: [
      {
        id: 'ai-mappings',
        nameKey: 'sitemapNodes.leafAiMappings',
        route: '/admin/ai-mappings',
        descKey: 'sitemapNodes.leafAiMappingsDesc',
        role: 'ADMIN',
        implemented: true,
      },
      {
        id: 'canonical-schema',
        nameKey: 'sitemapNodes.leafCanonical',
        route: '/admin/canonical-schema',
        descKey: 'sitemapNodes.leafCanonicalDesc',
        role: 'ADMIN',
        implemented: true,
      },
    ],
  },
];

export const InteractiveSitemap: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Initial state: ALL branches are collapsed on initial page load as explicitly requested.
  // Progressive reveal mode: single active branch or multi-expand for expandAll.
  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    public: false,
    access: false,
    citizen: false,
    official: false,
    admin: false,
  });

  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);

  const branchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Check if reduced motion is preferred
  const isReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Primary Interaction: Clicking ANYWHERE on a Category card expands it and collapses others
  const handleSelectBranch = (branchId: string) => {
    const isCurrentlyOpen = !!expandedBranches[branchId];

    if (isCurrentlyOpen) {
      // Toggle off / collapse
      setExpandedBranches((prev) => ({
        ...prev,
        [branchId]: false,
      }));
      if (activeBranchId === branchId) {
        setActiveBranchId(null);
      }
    } else {
      // Progressive reveal: open this branch, close others to keep focus clean
      setExpandedBranches({
        public: branchId === 'public',
        access: branchId === 'access',
        citizen: branchId === 'citizen',
        official: branchId === 'official',
        admin: branchId === 'admin',
      });
      setActiveBranchId(branchId);

      // Auto scroll newly revealed branch into comfortable view if needed
      setTimeout(() => {
        const el = branchRefs.current[branchId];
        if (el) {
          const rect = el.getBoundingClientRect();
          const isInView = rect.top >= 80 && rect.bottom <= window.innerHeight;
          if (!isInView) {
            el.scrollIntoView({
              behavior: isReducedMotion() ? 'auto' : 'smooth',
              block: 'nearest',
            });
          }
        }
      }, 100);
    }
  };

  const handleResetFlow = () => {
    setExpandedBranches({
      public: false,
      access: false,
      citizen: false,
      official: false,
      admin: false,
    });
    setActiveBranchId(null);
  };

  const expandAll = () => {
    setExpandedBranches({
      public: true,
      access: true,
      citizen: true,
      official: true,
      admin: true,
    });
    setActiveBranchId(null);
  };

  const collapseAll = () => {
    handleResetFlow();
  };

  const handleNavigate = (leaf: SitemapLeaf) => {
    if (!leaf.implemented) return;
    navigate(leaf.route);
  };

  const getRoleBadge = (role: SitemapLeaf['role']) => {
    switch (role) {
      case 'PUBLIC':
        return (
          <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
            {t('sitemapNodes.badgePublic', 'Public')}
          </span>
        );
      case 'CITIZEN':
        return (
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            {t('sitemapNodes.badgeCitizen', 'Citizen')}
          </span>
        );
      case 'OFFICIAL':
        return (
          <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
            {t('sitemapNodes.badgeOfficial', 'Official')}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="text-[10px] font-semibold bg-[#3A6EA5]/15 text-[#004E98] border border-[#3A6EA5]/30 px-2 py-0.5 rounded-full">
            {t('sitemapNodes.badgeAdmin', 'Admin')}
          </span>
        );
      case 'COMING_SOON':
        return (
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
            {t('sitemapNodes.badgeComingSoon', 'Coming Soon')}
          </span>
        );
    }
  };

  const activeBranch = SITEMAP_DATA.find((b) => b.id === activeBranchId);
  const anyBranchOpen = Object.values(expandedBranches).some(Boolean);

  return (
    <div className="w-full bg-[#FAFAFA] rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-8 md:p-10">
      {/* Sitemap Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004E98] text-white flex items-center justify-center shadow-md shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('sitemap.treeTitle', 'FISOP Guided Interactive Architecture Map')}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {t('sitemap.treeSubtitle', 'Click any category card to progressively reveal its connected routes and flow.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {anyBranchOpen && (
            <button
              type="button"
              onClick={handleResetFlow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#FF6700] bg-white hover:bg-slate-100 border border-slate-300 px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              title={t('sitemap.resetFlow', 'Reset Flow')}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#FF6700]" />
              <span>{t('sitemap.resetFlow', 'Reset Flow')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004E98] hover:text-white bg-white hover:bg-[#004E98] border border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('sitemap.expandAll', 'Expand All')}</span>
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('sitemap.collapseAll', 'Collapse All')}</span>
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Bar */}
      <div className="py-3 px-4 my-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            {t('sitemap.viewing', 'Current Path:')}
          </span>
          <button
            type="button"
            onClick={handleResetFlow}
            className="font-bold text-[#004E98] hover:text-[#FF6700] hover:underline cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('sitemap.breadcrumbRoot', 'FISOP Gateway')}</span>
          </button>

          {activeBranch && (
            <>
              <span className="text-slate-400">/</span>
              <span className="font-bold text-[#FF6700] bg-[#FF6700]/10 px-2 py-0.5 rounded">
                {t(activeBranch.titleKey)}
              </span>
            </>
          )}
        </div>

        {/* Guided instruction hint */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6700]" />
          <span>
            {activeBranch
              ? t('sitemap.activeHint', 'Click any child card below to navigate, or choose another category.')
              : t('sitemap.guidePrompt', 'Click any category card below to reveal its connected flow.')}
          </span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="mt-6 flex flex-col items-center">
        {/* Level 1: Root Gateway Node */}
        <button
          type="button"
          onClick={handleResetFlow}
          className="w-full max-w-xl bg-gradient-to-r from-[#004E98] to-[#003870] text-white rounded-2xl p-4 sm:p-5 shadow-xl border-2 border-[#FF6700] flex items-center justify-between relative group transition-all hover:scale-[1.01] cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#FF6700]"
          aria-label={t('sitemap.rootNode', 'FISOP GATEWAY ROOT')}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#FF6700] text-white flex items-center justify-center font-bold shadow-lg shrink-0 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-extrabold tracking-wide">
                  {t('sitemap.rootNode', 'FISOP GATEWAY ROOT')}
                </h4>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono font-bold">/</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                {t('sitemap.rootDesc', 'Central federated interoperability and service orchestration backbone')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-white text-[#004E98] px-3 py-1 rounded-xl shadow shrink-0">
            {t('sitemap.level1', 'Level 1: Root')}
          </span>
        </button>

        {/* Root-to-Branches Connector Line */}
        <div className="w-0.5 h-8 bg-gradient-to-b from-[#FF6700] via-[#3A6EA5] to-slate-300" />

        {/* Level 2 & 3: Progressive Category Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-1">
          {SITEMAP_DATA.map((branch) => {
            const Icon = branch.icon;
            const isExpanded = !!expandedBranches[branch.id];
            const isHovered = hoveredBranch === branch.id;
            const isCurrentActive = activeBranchId === branch.id;

            return (
              <div
                key={branch.id}
                ref={(el) => (branchRefs.current[branch.id] = el)}
                onMouseEnter={() => setHoveredBranch(branch.id)}
                onMouseLeave={() => setHoveredBranch(null)}
                className={`rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden ${
                  isExpanded
                    ? 'border-[#FF6700] shadow-xl ring-2 ring-[#FF6700]/30 bg-white'
                    : isHovered
                    ? 'border-[#3A6EA5] shadow-md bg-white -translate-y-0.5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Level 2 Entire Card is Clickable Button */}
                <button
                  type="button"
                  onClick={() => handleSelectBranch(branch.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectBranch(branch.id);
                    }
                  }}
                  className={`w-full text-left p-4 flex items-center justify-between cursor-pointer border-b transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6700] ${
                    isExpanded
                      ? 'bg-gradient-to-r from-orange-50/50 via-white to-blue-50/30 border-[#FF6700]/30'
                      : 'bg-white hover:bg-slate-50/90 border-slate-100'
                  }`}
                  aria-expanded={isExpanded}
                  aria-label={`${t(branch.titleKey)} - ${t('sitemap.clickToExplore', 'Click to explore flow')}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isExpanded
                          ? 'bg-[#FF6700] text-white scale-105 shadow'
                          : isHovered
                          ? 'bg-[#004E98] text-white scale-105'
                          : 'bg-[#3A6EA5]/15 text-[#004E98]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {t(branch.titleKey)}
                        </h4>
                        {isExpanded && (
                          <span className="text-[9px] bg-[#FF6700] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                            {t('sitemap.activeFocus', 'Active')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t(branch.descKey)}
                      </p>
                    </div>
                  </div>

                  {/* Expand Affordance & Child Counter */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                        isExpanded
                          ? 'bg-[#FF6700]/15 text-[#FF6700]'
                          : 'text-slate-700 bg-slate-100'
                      }`}
                    >
                      {branch.children.length} {t('sitemap.nodesCount', 'routes')}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isExpanded
                          ? 'bg-[#FF6700] text-white rotate-180 shadow-sm'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Level 3 Leaf Nodes (Child Pages) with Staggered Visual Transition */}
                {isExpanded && (
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-start bg-gradient-to-b from-orange-50/10 via-slate-50/50 to-white animate-fadeIn">
                    {/* Visual Connector inside branch */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200/70">
                      <ArrowRight className="w-3 h-3 text-[#FF6700]" />
                      <span>{t('sitemap.connectedPages', 'Connected Application Routes')}</span>
                    </div>

                    {branch.children.map((leaf, index) => {
                      const isCurrent = location.pathname === leaf.route;
                      return (
                        <div
                          key={leaf.id}
                          onClick={() => handleNavigate(leaf)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNavigate(leaf);
                            }
                          }}
                          tabIndex={leaf.implemented ? 0 : -1}
                          role="button"
                          aria-label={`${t(leaf.nameKey)} - ${leaf.route}`}
                          style={{
                            animationDelay: `${index * 60}ms`,
                          }}
                          className={`group p-3.5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#004E98] ${
                            leaf.implemented
                              ? 'bg-white hover:border-[#FF6700] hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                              : 'bg-slate-100/70 border-dashed border-slate-300 opacity-75 cursor-not-allowed'
                          } ${
                            isCurrent
                              ? 'border-[#FF6700] ring-2 ring-[#FF6700]/30 bg-orange-50/30 shadow-md'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-[#004E98] transition-colors">
                              {t(leaf.nameKey)}
                              {leaf.implemented && (
                                <ExternalLink className="w-3.5 h-3.5 text-[#FF6700] opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </span>
                            {getRoleBadge(leaf.role)}
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            {t(leaf.descKey)}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                            <code className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {leaf.route}
                            </code>
                            {leaf.implemented ? (
                              <span className="text-[#004E98] group-hover:text-[#FF6700] font-bold inline-flex items-center gap-1 transition-colors">
                                {t('sitemap.launchPage', 'Open Page →')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">
                                {t('sitemap.planned', 'Planned')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Safety Guard Notes */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-900">{t('sitemap.accessGuards', 'Access Guards:')}</span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> {t('sitemapNodes.badgePublic', 'Public')}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('sitemapNodes.badgeCitizen', 'Citizen (JWT)')}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {t('sitemapNodes.badgeOfficial', 'Official (RBAC)')}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#004E98]" /> {t('sitemapNodes.badgeAdmin', 'Admin (Governance)')}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('sitemap.guardNotice', 'Protected routes enforce Keycloak OIDC authentication & role tokens')}</span>
        </div>
      </div>
    </div>
  );
};

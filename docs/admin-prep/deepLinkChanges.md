# Deep Link + State Restore Plan

Target URL shape:
/reports?tab=admin&templateId=…&sectionId=…&mode=preview

Goals
- Admin tab auto-open (tab=admin)
- Selected template auto-load (templateId)
- Selected section within TemplateEditor auto-focus (sectionId)
- Preview mode auto-activate (mode=preview → run preview for that section)

Changes in src/pages/ReportsPage.tsx
1) Parse query params on mount and when location.search changes
- keys: tab, templateId, sectionId, mode
- if tab==='admin' then setActiveTab('admin')
- pass templateId/sectionId/mode down via props/context to ReportsAdmin

2) Add optional props to ReportsAdmin
- initialTemplateId?: string
- initialSectionId?: string
- initialPreviewMode?: boolean

3) ReportsAdmin: when mounted, if initialTemplateId present and TemplatesList has loaded items, auto-select matching template and setSelected.
- If initialSectionId present, propagate to TemplateEditor via prop initialSectionId.

4) TemplateEditor: accept initialSectionId and initialPreviewMode.
- After rows computed, if initialSectionId matches a row, scroll into view and (if initialPreviewMode) trigger its SectionPreview.runPreview().
- Expose SectionPreview handler via ref or an imperative prop callback.

Example code snippets

In ReportsPage.tsx
```
const [searchParams] = useState(new URLSearchParams(window.location.search));
useEffect(() => {
  const tab = searchParams.get('tab');
  if (tab === 'admin') setActiveTab('admin');
}, []);

const initialTemplateId = useMemo(() => searchParams.get('templateId') || undefined, []);
const initialSectionId = useMemo(() => searchParams.get('sectionId') || undefined, []);
const initialPreviewMode = useMemo(() => searchParams.get('mode') === 'preview', []);

{activeTab === 'admin' && (
  <ReportsAdmin
    initialTemplateId={initialTemplateId}
    initialSectionId={initialSectionId}
    initialPreviewMode={initialPreviewMode}
  />
)}
```

In ReportsAdmin.tsx
```
export interface ReportsAdminProps {
  initialTemplateId?: string;
  initialSectionId?: string;
  initialPreviewMode?: boolean;
}

const ReportsAdmin: React.FC<ReportsAdminProps> = (props) => {
  const [selected, setSelected] = useState<ReportTemplate | null>(null);
  const [items, setItems] = useState<ReportTemplate[]>([]);

  // Provide items to TemplatesList via props or lift listTemplates here
  // After items load:
  useEffect(() => {
    if (!props.initialTemplateId || !items.length) return;
    const match = items.find(t => t.id === props.initialTemplateId);
    if (match) setSelected(match);
  }, [items, props.initialTemplateId]);

  return (/* pass initialSectionId/initialPreviewMode down to TemplateEditor */);
}
```

In TemplateEditor.tsx
```
export const TemplateEditor: React.FC<{ template: ReportTemplate | null; initialSectionId?: string; initialPreviewMode?: boolean; }> = ({ template, initialSectionId, initialPreviewMode }) => {
  const [rows, setRows] = useState<TemplateSection[]>(template?.sections || []);
  const previewRefs = useRef<Record<string, { runPreview: () => void }>>({});

  useEffect(() => {
    if (!initialSectionId) return;
    const target = rows.find(r => r.id === initialSectionId);
    if (target) {
      document.querySelector(`[data-testid=admin-te-sec-prev-${target.id}]`)?.scrollIntoView({ behavior: 'smooth' });
      if (initialPreviewMode) previewRefs.current[target.id]?.runPreview?.();
    }
  }, [rows, initialSectionId, initialPreviewMode]);

  // Attach ref to SectionPreview instances
  // <SectionPreview ref={el => (previewRefs.current[r.id] = el)} ... />
}
```

Notes
- Keep URL as source of truth; optionally push updates on user selection for shareable links.
- Use data-testid to scroll/target elements reliably.


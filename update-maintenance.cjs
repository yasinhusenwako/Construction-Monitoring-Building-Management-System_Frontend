const fs = require('fs');
const file = 'src/views/maintenance/MaintenanceDetailPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const divStruct = `
const MAINTENANCE_DIVISIONS = [
  {
    id: "DIV-001",
    name: "Power Supply Division",
    tasks: [
      "Generator Installation and Maintenance",
      "Electric line Installation and Maintenance",
      "AC (Air Conditioning) Installation and Maintenance",
      "UPS Installation and Maintenance",
      "Boiler Installation and Maintenance",
      "Stove Installation and Maintenance",
      "Water Distiller Installation and Maintenance",
      "Divider Maintenance",
      "Chiller Maintenance",
      "LIFT (Elevator) Maintenance",
      "Preventive Maintenance for: Generators, UPS, AC, Lifts, and Water Distillers"
    ]
  },
  {
    id: "DIV-002",
    name: "Facility Administration Division",
    tasks: [
      "Cleaning services for the entire building",
      "Gardening and landscaping",
      "Maintaining the beauty of the compound",
      "Moving and shifting furniture/office items"
    ]
  },
  {
    id: "DIV-003",
    name: "Infrastructure Development and Building Maintenance Division",
    tasks: [
      "Executing building maintenance work",
      "Executing building construction work",
      "Executing water and sewerage line installation and maintenance",
      "Executing electrical line installation and maintenance",
      "Executing carpentry and woodwork",
      "Manufacturing furniture"
    ]
  }
];
`;

content = content.replace('export function MaintenanceDetailPage() {', divStruct + '\nexport function MaintenanceDetailPage() {');
content = content.replace('const [selectedTech, setSelectedTech] = useState("");', 'const [selectedTech, setSelectedTech] = useState("");\n  const [selectedDivisionId, setSelectedDivisionId] = useState("");\n  const [selectedTaskType, setSelectedTaskType] = useState("");');

const adminAssignOld = `{maint.status === "Under Review" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      {t("maintenance.assignSupervisor")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                    >
                      <option value="">
                        {t("maintenance.placeholder.selectCategory").replace(
                          "category",
                          "supervisor",
                        )}
                      </option>
                      {systemUsers
                        .filter((u) => u.role === "supervisor")
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.department})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        const supervisorUser = systemUsers.find(
                          (u) => u.id === selectedTech,
                        );
                        handleAction(
                          "Assigned to Supervisor",
                          "admin",
                          t("requests.assigned_to_supervisor"),
                          {
                            supervisorId: selectedTech,
                            divisionId: supervisorUser?.divisionId || "1",
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#1A3580] text-white hover:bg-[#0E2271] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> {t("maintenance.assignSupervisor")}
                    </button>
                  </div>
                )}`;

const adminAssignNew = `{maint.status === "Under Review" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide">
                      Select Division
                    </label>
                    <select
                      value={selectedDivisionId}
                      onChange={(e) => {
                        setSelectedDivisionId(e.target.value);
                        setSelectedTech("");
                      }}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all"
                    >
                      <option value="">Select Division...</option>
                      {MAINTENANCE_DIVISIONS.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.name}
                        </option>
                      ))}
                    </select>

                    <label className="block text-xs font-semibold text-[#0E2271] mb-2 uppercase tracking-wide opacity-80 mt-2">
                      Assign Supervisor
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      disabled={!selectedDivisionId}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#1A3580]/20 focus:border-[#1A3580] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Supervisor...</option>
                      {systemUsers
                        .filter((u) => u.role === "supervisor")
                        // Use string comparisons if needed - ideally they match DIV-XXX
                        .filter((u) => !u.divisionId || u.divisionId === selectedDivisionId)
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.department})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech || !selectedDivisionId) return;
                        handleAction(
                          "Assigned to Supervisor",
                          "admin",
                          t("requests.assigned_to_supervisor"),
                          {
                            supervisorId: selectedTech,
                            divisionId: selectedDivisionId,
                          },
                        );
                      }}
                      disabled={!selectedTech || !selectedDivisionId}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#1A3580] text-white hover:bg-[#0E2271] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} /> Assign Supervisor
                    </button>
                  </div>
                )}`;

content = content.replace(adminAssignOld, adminAssignNew);

const supAssignOld = `{maint.status === "WorkOrder Created" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#CC1F1A] mb-2 uppercase tracking-wide">
                      {t("maintenance.assignProfessional")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all"
                    >
                      <option value="">
                        {t("maintenance.placeholder.selectCategory").replace(
                          "category",
                          "professional",
                        )}
                      </option>
                      {systemUsers
                        .filter((u) => u.role === "professional")
                        .filter((u) => u.divisionId === maint.divisionId)
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.department})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech) return;
                        handleAction(
                          "Assigned to Professional",
                          "supervisor",
                          t("requests.assigned_to_professional"),
                          {
                            assignedTo: selectedTech,
                            notes: "",
                          },
                        );
                      }}
                      disabled={!selectedTech}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#CC1F1A] text-white hover:bg-[#aa1814] disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />{" "}
                      {t("maintenance.assignProfessional")}
                    </button>
                  </div>
                )}`;

const supAssignNew = `{maint.status === "WorkOrder Created" && (
                  <div className="p-4 bg-white rounded-lg border border-border shadow-sm">
                    <label className="block text-xs font-semibold text-[#CC1F1A] mb-2 uppercase tracking-wide">
                      Task Category
                    </label>
                    <select
                      value={selectedTaskType}
                      onChange={(e) => setSelectedTaskType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all"
                    >
                      <option value="">Select task category...</option>
                      {MAINTENANCE_DIVISIONS.find(d => d.id === (maint.divisionId || currentUser?.divisionId))?.tasks.map(task => (
                        <option key={task} value={task}>{task}</option>
                      ))}
                    </select>
                    
                    <label className="block text-xs font-semibold text-[#CC1F1A] mb-2 uppercase tracking-wide opacity-80 mt-2">
                      {t("maintenance.assignProfessional")}
                    </label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      disabled={!selectedTaskType}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-background text-sm outline-none mb-3 focus:ring-2 focus:ring-[#CC1F1A]/20 focus:border-[#CC1F1A] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select professional...</option>
                      {systemUsers
                        .filter((u) => u.role === "professional")
                        .filter((u) => u.divisionId === maint.divisionId)
                        .map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.department})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!selectedTech || !selectedTaskType) return;
                        handleAction(
                          "Assigned to Professional",
                          "supervisor",
                          t("requests.assigned_to_professional"),
                          { 
                            assignedTo: selectedTech,
                            notes: selectedTaskType
                          },
                        );
                      }}
                      disabled={!selectedTech || !selectedTaskType}
                      className="w-full py-2.5 rounded-lg text-sm font-bold bg-[#CC1F1A] text-white hover:bg-[#aa1814] disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />{" "}
                      {t("maintenance.assignProfessional")}
                    </button>
                  </div>
                )}`;

content = content.replace(supAssignOld, supAssignNew);

fs.writeFileSync(file, content);
console.log('Update Complete!');

export function PAMRoot() {
  return (
    <div
      data-testid="PAMRoot"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-text">
          PAM 资产中心
        </h1>
        <button
          // onClick={() => {
          //   setEditingProject(null);
          //   setIsModalOpen(true);
          // }}
          className="bg-primary hover:bg-primary-hover text-on-brand px-4 py-2 rounded-xl transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> 新增资产
        </button>
      </div>
    </div>
  );
}

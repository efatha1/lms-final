// ... (previous imports remain the same)

export default function LoanApplications() {
  // ... (previous state and hooks remain the same)

  const [formData, setFormData] = useState({
    applicant_name: '',
    nida_id: '',
    loan_amount: '',
    term_months: '',
    interest_rate: '',
    employment_status: 'Employed',
    mode_of_repayment: 'monthly',
    sponsor1_name: '',
    sponsor1_id: '',
    sponsor2_name: '',
    sponsor2_id: '',
  });
  
  const [formFiles, setFormFiles] = useState({
    employment_proof: null as File | null,
    sponsor1_doc: null as File | null,
    sponsor2_doc: null as File | null,
    terms_doc: null as File | null,
    local_government_id: null as File | null,
    title_deed: null as File | null,
    vehicle_registration: null as File | null,
    csee_certificate: null as File | null,
    acse_certificate: null as File | null,
    higher_education_certificate: null as File | null,
  });

  // ... (rest of the component logic remains the same)

  return (
    <PageContainer title="Loan Applications">
      {/* ... (previous JSX remains the same) */}

      {/* Create Application Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
            resetForm();
          }
        }}
        title="Create Loan Application"
        size="lg"
      >
        <form onSubmit={handleCreateApplication}>
          {/* ... (previous form fields remain the same) */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employment Status *
            </label>
            <select
              name="employment_status"
              value={formData.employment_status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              required
              disabled={isSubmitting}
            >
              <option value="Employed">Employed</option>
              <option value="Entrepreneur">Entrepreneur</option>
            </select>
          </div>

          {formData.employment_status === 'Employed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employment Proof *
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.employment_proof ? formFiles.employment_proof.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="employment_proof"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Additional document fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local Government Identification Letter
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.local_government_id ? formFiles.local_government_id.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="local_government_id"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Deed
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.title_deed ? formFiles.title_deed.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="title_deed"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Registration Card
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.vehicle_registration ? formFiles.vehicle_registration.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="vehicle_registration"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSEE Certificate
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.csee_certificate ? formFiles.csee_certificate.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="csee_certificate"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ACSE Certificate
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.acse_certificate ? formFiles.acse_certificate.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="acse_certificate"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Higher Education Certificate
              </label>
              <div className="flex items-center">
                <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                  <Upload className="h-5 w-5 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formFiles.higher_education_certificate ? formFiles.higher_education_certificate.name : 'Upload File'}
                  </span>
                  <input
                    type="file"
                    name="higher_education_certificate"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ... (rest of the form and modal content remains the same) */}
        </form>
      </Modal>

      {/* ... (rest of the component remains the same) */}
    </PageContainer>
  );
}
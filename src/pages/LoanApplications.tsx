import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchLoanApplications, createLoanApplication, updateLoanApplicationStatus, deleteLoanApplication } from '../api/loanApplications';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';
import { Modal } from '../components/ui/modal';
import { DocumentViewer } from '../components/ui/document-viewer';
import { LoanApplication, Document, RepaymentSchedule } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { generateRepaymentSchedule } from '../utils/loanCalculations';
import { 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function LoanApplications() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentSchedule[]>([]);
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  
  // Form state
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
    local_govt_letter: null as File | null,
    title_deed: null as File | null,
    vehicle_reg_card: null as File | null,
    csee_certificate: null as File | null,
    acse_certificate: null as File | null,
    higher_edu_certificate: null as File | null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadApplications = async () => {
      if (!token) return;
      
      try {
        const data = await fetchLoanApplications(token);
        setApplications(data);
        setFilteredApplications(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load loan applications');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, [token, showToast]);

  // Filter applications based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredApplications(applications);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = applications.filter(
        app => 
          app.applicant_name.toLowerCase().includes(lowercaseQuery) ||
          app.nida_id.toLowerCase().includes(lowercaseQuery) ||
          app.status.toLowerCase().includes(lowercaseQuery) ||
          app.loan_amount.toString().includes(lowercaseQuery)
      );
      setFilteredApplications(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, applications]);

  // Get current applications for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const handleViewApplication = (application: LoanApplication) => {
    setSelectedApplication(application);
    
    // Generate repayment schedule
    const schedule = generateRepaymentSchedule(
      application.loan_amount,
      application.interest_rate,
      application.term_months,
      application.mode_of_repayment,
      new Date(application.created_at)
    );
    setRepaymentSchedule(schedule);
    
    // Fetch documents (mock for now)
    // In a real implementation, you would fetch the documents from the server
    setDocuments({
      employment_proof: {
        id: application.employment_proof,
        filename: 'employment_proof.pdf',
        path: '/uploads/employment_proof.pdf',
        uploaded_at: application.created_at,
        related_table: 'loan_applications',
        related_id: application.id,
      },
      sponsor1_doc: {
        id: application.sponsor1_doc,
        filename: 'sponsor1_doc.pdf',
        path: '/uploads/sponsor1_doc.pdf',
        uploaded_at: application.created_at,
        related_table: 'loan_applications',
        related_id: application.id,
      },
      sponsor2_doc: {
        id: application.sponsor2_doc,
        filename: 'sponsor2_doc.pdf',
        path: '/uploads/sponsor2_doc.pdf',
        uploaded_at: application.created_at,
        related_table: 'loan_applications',
        related_id: application.id,
      },
      terms_doc: {
        id: application.terms_doc,
        filename: 'terms_doc.pdf',
        path: '/uploads/terms_doc.pdf',
        uploaded_at: application.created_at,
        related_table: 'loan_applications',
        related_id: application.id,
      },
    });
    
    setIsViewModalOpen(true);
  };

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    if (!token) return;
    
    try {
      await updateLoanApplicationStatus(token, id, status);
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status } : app
      ));
      
      showToast('success', 'Status Updated', `Application ${status} successfully`);
      
      // If we're viewing this application, update the selected application
      if (selectedApplication && selectedApplication.id === id) {
        setSelectedApplication({ ...selectedApplication, status });
      }
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }
    
    try {
      await deleteLoanApplication(token, id);
      
      // Update local state
      setApplications(applications.filter(app => app.id !== id));
      
      showToast('success', 'Application Deleted', 'Application deleted successfully');
      
      // If we're viewing this application, close the modal
      if (selectedApplication && selectedApplication.id === id) {
        setIsViewModalOpen(false);
      }
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to delete application');
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    
    // Validate form
    if (!formData.applicant_name || !formData.nida_id || !formData.loan_amount || 
        !formData.term_months || !formData.interest_rate || !formData.sponsor1_name || 
        !formData.sponsor1_id || !formData.sponsor2_name || !formData.sponsor2_id) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    // Validate required files
    if (!formFiles.sponsor1_doc || !formFiles.sponsor2_doc || !formFiles.terms_doc) {
      showToast('error', 'Validation Error', 'Please upload all required documents');
      setIsSubmitting(false);
      return;
    }
    
    // Validate employment proof if employed
    if (formData.employment_status === 'Employed' && !formFiles.employment_proof) {
      showToast('error', 'Validation Error', 'Please upload employment proof document');
      setIsSubmitting(false);
      return;
    }
    
    // Create FormData object for file upload
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataObj.append(key, value.toString());
    });
    
    // Add required files
    if (formData.employment_status === 'Employed' && formFiles.employment_proof) {
      formDataObj.append('employment_proof', formFiles.employment_proof);
    }
    
    if (formFiles.sponsor1_doc) {
      formDataObj.append('sponsor1_doc', formFiles.sponsor1_doc);
    }
    
    if (formFiles.sponsor2_doc) {
      formDataObj.append('sponsor2_doc', formFiles.sponsor2_doc);
    }
    
    if (formFiles.terms_doc) {
      formDataObj.append('terms_doc', formFiles.terms_doc);
    }
    
    // Add optional files if present
    if (formFiles.local_govt_letter) {
      formDataObj.append('local_govt_letter', formFiles.local_govt_letter);
    }
    
    if (formFiles.title_deed) {
      formDataObj.append('title_deed', formFiles.title_deed);
    }
    
    if (formFiles.vehicle_reg_card) {
      formDataObj.append('vehicle_reg_card', formFiles.vehicle_reg_card);
    }
    
    if (formFiles.csee_certificate) {
      formDataObj.append('csee_certificate', formFiles.csee_certificate);
    }
    
    if (formFiles.acse_certificate) {
      formDataObj.append('acse_certificate', formFiles.acse_certificate);
    }
    
    if (formFiles.higher_edu_certificate) {
      formDataObj.append('higher_edu_certificate', formFiles.higher_edu_certificate);
    }
    
    try {
      const newApplication = await createLoanApplication(token, formDataObj);
      
      // Update local state
      setApplications([newApplication, ...applications]);
      
      showToast('success', 'Application Created', 'Loan application created successfully');
      
      // Reset form and close modal
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
    
    setFormFiles({
      employment_proof: null,
      sponsor1_doc: null,
      sponsor2_doc: null,
      terms_doc: null,
      local_govt_letter: null,
      title_deed: null,
      vehicle_reg_card: null,
      csee_certificate: null,
      acse_certificate: null,
      higher_edu_certificate: null,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFormFiles(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Loan Applications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Loan Applications">
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="relative mb-4 md:mb-0 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Application
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loan Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repayment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentApplications.length > 0 ? (
                  currentApplications.map(application => (
                    <tr key={application.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{application.applicant_name}</div>
                        <div className="text-sm text-gray-500">{application.nida_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>{formatCurrency(application.loan_amount)}</div>
                        <div className="text-sm text-gray-500">
                          {application.term_months} months @ {application.interest_rate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {application.mode_of_repayment.charAt(0).toUpperCase() + application.mode_of_repayment.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(application.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={application.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewApplication(application)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(application.id, 'approved')}
                                className="p-1 text-green-600 hover:text-green-800"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              
                              <button
                                onClick={() => handleUpdateStatus(application.id, 'rejected')}
                                className="p-1 text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleDeleteApplication(application.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No loan applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt4">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicant Name *
              </label>
              <input
                type="text"
                name="applicant_name"
                value={formData.applicant_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIDA ID *
              </label>
              <input
                type="text"
                name="nida_id"
                value={formData.nida_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount *
              </label>
              <input
                type="number"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                min="1"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term (Months) *
              </label>
              <input
                type="number"
                name="term_months"
                value={formData.term_months}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                min="1"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                name="interest_rate"
                value={formData.interest_rate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode of Repayment *
              </label>
              <select
                name="mode_of_repayment"
                value={formData.mode_of_repayment}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Sponsor 1</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="sponsor1_name"
                  value={formData.sponsor1_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID *
                </label>
                <input
                  type="text"
                  name="sponsor1_id"
                  value={formData.sponsor1_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Sponsor 2</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="sponsor2_name"
                  value={formData.sponsor2_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID *
                </label>
                <input
                  type="text"
                  name="sponsor2_id"
                  value={formData.sponsor2_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Required Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        required={formData.employment_status === 'Employed'}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsor 1 Document *
                </label>
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formFiles.sponsor1_doc ? formFiles.sponsor1_doc.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="sponsor1_doc"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsor 2 Document *
                </label>
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formFiles.sponsor2_doc ? formFiles.sponsor2_doc.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="sponsor2_doc"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms Document *
                </label>
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formFiles.terms_doc ? formFiles.terms_doc.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="terms_doc"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Optional Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local Government ID Letter
                </label>
                <div className="flex items-center">
                  <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <Upload className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {formFiles.local_govt_letter ? formFiles.local_govt_letter.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="local_govt_letter"
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
                      {formFiles.vehicle_reg_card ? formFiles.vehicle_reg_card.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="vehicle_reg_card"
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
                      {formFiles.higher_edu_certificate ? formFiles.higher_edu_certificate.name : 'Upload File'}
                    </span>
                    <input
                      type="file"
                      name="higher_edu_certificate"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setIsCreateModalOpen(false);
                  resetForm();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                  Submitting...
                </>
              ) : (
                'Create Application'
              )}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* View Application Modal */}
      {selectedApplication && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Application: ${selectedApplication.applicant_name}`}
          size="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base">{selectedApplication.applicant_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">NIDA ID</p>
                  <p className="text-base">{selectedApplication.nida_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Status</p>
                  <p className="text-base">{selectedApplication.employment_status}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-base">{formatCurrency(selectedApplication.loan_amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Term</p>
                  <p className="text-base">{selectedApplication.term_months} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Interest Rate</p>
                  <p className="text-base">{selectedApplication.interest_rate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Repayment Mode</p>
                  <p className="text-base">
                    {selectedApplication.mode_of_repayment.charAt(0).toUpperCase() + 
                     selectedApplication.mode_of_repayment.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <StatusBadge status={selectedApplication.status} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sponsors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Sponsor 1</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{selectedApplication.sponsor1_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID</p>
                    <p className="text-base">{selectedApplication.sponsor1_id}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Sponsor 2</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{selectedApplication.sponsor2_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID</p>
                    <p className="text-base">{selectedApplication.sponsor2_id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Repayment Schedule</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Principal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repaymentSchedule.map((payment) => (
                    <tr key={payment.payment_number}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.payment_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.principal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.interest)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.total_payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.remaining_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentViewer 
                url={documents.employment_proof?.path || ''} 
                filename="Employment Proof" 
              />
              <DocumentViewer 
                url={documents.sponsor1_doc?.path || ''} 
                filename="Sponsor 1 Document" 
              />
              <DocumentViewer 
                url={documents.sponsor2_doc?.path || ''} 
                filename="Sponsor 2 Document" 
              />
              <DocumentViewer 
                url={documents.terms_doc?.path || ''} 
                filename="Terms Document" 
              />
            </div>
          </div>
          
          {selectedApplication.status === 'pending' && (
            <div className="flex justify-end space-x-3 mt-6 border-t pt-6">
              <button
                onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50"
              >
                Reject Application
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedApplication.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Approve Application
              </button>
            </div>
          )}
        </Modal>
      )}
    </PageContainer>
  );
}
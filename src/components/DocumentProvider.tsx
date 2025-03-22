import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";
import { useAuth, AuthUser } from './AuthProvider';
import { format } from 'date-fns';

// Define types
export type DocumentType = 'pdf' | 'doc' | 'xls' | 'ppt' | 'txt' | 'image' | 'other';
export type DocumentStatus = 'draft' | 'published' | 'archived';
export type DocumentAccess = 'public' | 'department' | 'private' | 'custom';

export interface DocumentVersion {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  changeDescription: string;
  fileUrl: string;
}

export interface DocumentTag {
  id: string;
  name: string;
  color: string;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  department: string;
  status: DocumentStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fileSize: number;
  fileUrl: string;
  thumbnail?: string;
  accessLevel: DocumentAccess;
  authorizedUsers?: string[];
  authorizedDepartments?: string[];
  versions: DocumentVersion[];
  tags: string[];
  isFavorite: boolean;
}

interface DocumentContextType {
  documents: Document[];
  filteredDocuments: Document[];
  tags: DocumentTag[];
  addDocument: (doc: Partial<Document>) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => Document | undefined;
  addDocumentVersion: (docId: string, version: Partial<DocumentVersion>) => void;
  addTag: (tag: Partial<DocumentTag>) => void;
  deleteTag: (id: string) => void;
  filterDocuments: (options: {
    search?: string;
    type?: DocumentType[];
    department?: string[];
    tags?: string[];
    dateRange?: [Date | null, Date | null];
    status?: DocumentStatus[];
  }) => void;
  toggleFavorite: (id: string) => void;
  downloadDocument: (id: string) => void;
  shareDocument: (id: string, users: string[]) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Mock initial document tags
const INITIAL_TAGS: DocumentTag[] = [
  { id: 'tag1', name: 'Important', color: '#ef4444' },
  { id: 'tag2', name: 'Contract', color: '#3b82f6' },
  { id: 'tag3', name: 'Report', color: '#10b981' },
  { id: 'tag4', name: 'Draft', color: '#f59e0b' },
  { id: 'tag5', name: 'Confidential', color: '#6366f1' },
];

// Mock initial documents
const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    title: 'Q3 Department Performance Report',
    description: 'Overall metrics and KPIs for all departments',
    type: 'pdf',
    department: 'Management',
    status: 'published',
    createdBy: 'user1',
    createdAt: '2023-09-30T10:00:00Z',
    updatedAt: '2023-09-30T10:00:00Z',
    fileSize: 2560000,
    fileUrl: '/documents/report.pdf',
    thumbnail: '/thumbnails/pdf.png',
    accessLevel: 'department',
    authorizedDepartments: ['Management', 'HR'],
    versions: [
      {
        id: 'v1doc1',
        version: 1,
        updatedAt: '2023-09-30T10:00:00Z',
        updatedBy: 'user1',
        changeDescription: 'Initial version',
        fileUrl: '/documents/report_v1.pdf',
      }
    ],
    tags: ['tag3', 'tag1'],
    isFavorite: false,
  },
  {
    id: 'doc2',
    title: 'Annual Revenue Projection',
    description: 'Financial forecasting and revenue trends',
    type: 'xls',
    department: 'Finance',
    status: 'published',
    createdBy: 'user4',
    createdAt: '2023-12-15T14:30:00Z',
    updatedAt: '2023-12-16T09:15:00Z',
    fileSize: 1250000,
    fileUrl: '/documents/projection.xlsx',
    thumbnail: '/thumbnails/xls.png',
    accessLevel: 'custom',
    authorizedUsers: ['user1', 'user3', 'user4'],
    versions: [
      {
        id: 'v1doc2',
        version: 1,
        updatedAt: '2023-12-15T14:30:00Z',
        updatedBy: 'user4',
        changeDescription: 'Initial version',
        fileUrl: '/documents/projection_v1.xlsx',
      },
      {
        id: 'v2doc2',
        version: 2,
        updatedAt: '2023-12-16T09:15:00Z',
        updatedBy: 'user4',
        changeDescription: 'Updated Q1 projections',
        fileUrl: '/documents/projection_v2.xlsx',
      }
    ],
    tags: ['tag1'],
    isFavorite: true,
  },
  {
    id: 'doc3',
    title: 'Employee Satisfaction Survey Results',
    description: 'Results from the quarterly employee feedback survey',
    type: 'ppt',
    department: 'HR',
    status: 'published',
    createdBy: 'user2',
    createdAt: '2023-08-22T11:45:00Z',
    updatedAt: '2023-08-22T11:45:00Z',
    fileSize: 3750000,
    fileUrl: '/documents/survey.pptx',
    thumbnail: '/thumbnails/ppt.png',
    accessLevel: 'department',
    authorizedDepartments: ['HR', 'Management'],
    versions: [
      {
        id: 'v1doc3',
        version: 1,
        updatedAt: '2023-08-22T11:45:00Z',
        updatedBy: 'user2',
        changeDescription: 'Initial version',
        fileUrl: '/documents/survey_v1.pptx',
      }
    ],
    tags: ['tag3'],
    isFavorite: false,
  },
  {
    id: 'doc4',
    title: 'Project Alpha Contract',
    description: 'Legal contract for Project Alpha with client XYZ Corp',
    type: 'doc',
    department: 'Legal',
    status: 'published',
    createdBy: 'user1',
    createdAt: '2023-10-05T09:30:00Z',
    updatedAt: '2023-10-10T16:20:00Z',
    fileSize: 1800000,
    fileUrl: '/documents/contract.docx',
    thumbnail: '/thumbnails/doc.png',
    accessLevel: 'private',
    authorizedUsers: ['user1'],
    versions: [
      {
        id: 'v1doc4',
        version: 1,
        updatedAt: '2023-10-05T09:30:00Z',
        updatedBy: 'user1',
        changeDescription: 'Initial draft',
        fileUrl: '/documents/contract_v1.docx',
      },
      {
        id: 'v2doc4',
        version: 2,
        updatedAt: '2023-10-10T16:20:00Z',
        updatedBy: 'user1',
        changeDescription: 'Final version after client review',
        fileUrl: '/documents/contract_v2.docx',
      }
    ],
    tags: ['tag2', 'tag5'],
    isFavorite: true,
  },
  {
    id: 'doc5',
    title: 'Marketing Campaign Results',
    description: 'Performance metrics for Q3 marketing initiatives',
    type: 'ppt',
    department: 'Marketing',
    status: 'published',
    createdBy: 'user3',
    createdAt: '2023-09-15T15:10:00Z',
    updatedAt: '2023-09-15T15:10:00Z',
    fileSize: 4200000,
    fileUrl: '/documents/marketing.pptx',
    thumbnail: '/thumbnails/ppt.png',
    accessLevel: 'department',
    authorizedDepartments: ['Marketing', 'Management'],
    versions: [
      {
        id: 'v1doc5',
        version: 1,
        updatedAt: '2023-09-15T15:10:00Z',
        updatedBy: 'user3',
        changeDescription: 'Initial version',
        fileUrl: '/documents/marketing_v1.pptx',
      }
    ],
    tags: ['tag3'],
    isFavorite: false,
  },
];

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [tags, setTags] = useState<DocumentTag[]>(INITIAL_TAGS);

  // Check if user has access to a document
  const hasDocumentAccess = (doc: Document, currentUser: AuthUser | null): boolean => {
    if (!currentUser) return false;
    
    // Admin has access to everything
    if (currentUser.role === 'admin') return true;
    
    // Public documents are accessible to everyone
    if (doc.accessLevel === 'public') return true;
    
    // Check department-level access
    if (doc.accessLevel === 'department' && doc.authorizedDepartments?.includes(currentUser.department)) {
      return true;
    }
    
    // Check user-level access
    if (doc.accessLevel === 'custom' && doc.authorizedUsers?.includes(currentUser.id)) {
      return true;
    }
    
    // The creator always has access
    if (doc.createdBy === currentUser.id) {
      return true;
    }
    
    // Private documents are only accessible to the creator
    if (doc.accessLevel === 'private' && doc.createdBy === currentUser.id) {
      return true;
    }
    
    return false;
  };

  // Filter documents based on user permissions
  const getAccessibleDocuments = (docs: Document[], currentUser: AuthUser | null): Document[] => {
    if (!currentUser) return [];
    
    return docs.filter(doc => hasDocumentAccess(doc, currentUser));
  };

  // Add a new document
  const addDocument = (doc: Partial<Document>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add documents",
        variant: "destructive",
      });
      return;
    }
    
    const newDoc: Document = {
      id: uuidv4(),
      title: doc.title || 'Untitled',
      description: doc.description || '',
      type: doc.type || 'pdf',
      department: doc.department || user.department,
      status: doc.status || 'draft',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileSize: doc.fileSize || 0,
      fileUrl: doc.fileUrl || '',
      thumbnail: doc.thumbnail,
      accessLevel: doc.accessLevel || 'private',
      authorizedUsers: doc.authorizedUsers || [],
      authorizedDepartments: doc.authorizedDepartments || [],
      versions: [
        {
          id: uuidv4(),
          version: 1,
          updatedAt: new Date().toISOString(),
          updatedBy: user.id,
          changeDescription: 'Initial version',
          fileUrl: doc.fileUrl || '',
        }
      ],
      tags: doc.tags || [],
      isFavorite: false,
    };
    
    setDocuments(prev => [...prev, newDoc]);
    setFilteredDocuments(prev => [...prev, newDoc]);
    
    toast({
      title: "Document added",
      description: `${newDoc.title} has been uploaded successfully.`,
    });
  };

  // Update an existing document
  const updateDocument = (id: string, updates: Partial<Document>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update documents",
        variant: "destructive",
      });
      return;
    }
    
    const docIndex = documents.findIndex(d => d.id === id);
    
    if (docIndex === -1) {
      toast({
        title: "Document not found",
        description: "The document you are trying to update does not exist",
        variant: "destructive",
      });
      return;
    }
    
    const currentDoc = documents[docIndex];
    
    // Check if user has permission to update
    const canUpdate = user.role === 'admin' || 
                     currentDoc.createdBy === user.id || 
                     (user.role === 'department_head' && currentDoc.department === user.department);
    
    if (!canUpdate) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update this document",
        variant: "destructive",
      });
      return;
    }
    
    const updatedDoc = {
      ...currentDoc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const newDocuments = [...documents];
    newDocuments[docIndex] = updatedDoc;
    
    setDocuments(newDocuments);
    setFilteredDocuments(getAccessibleDocuments(newDocuments, user));
    
    toast({
      title: "Document updated",
      description: `${updatedDoc.title} has been updated successfully.`,
    });
  };

  // Delete a document
  const deleteDocument = (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to delete documents",
        variant: "destructive",
      });
      return;
    }
    
    const docIndex = documents.findIndex(d => d.id === id);
    
    if (docIndex === -1) {
      toast({
        title: "Document not found",
        description: "The document you are trying to delete does not exist",
        variant: "destructive",
      });
      return;
    }
    
    const currentDoc = documents[docIndex];
    
    // Check if user has permission to delete
    const canDelete = user.role === 'admin' || 
                     currentDoc.createdBy === user.id || 
                     (user.role === 'department_head' && currentDoc.department === user.department);
    
    if (!canDelete) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete this document",
        variant: "destructive",
      });
      return;
    }
    
    const newDocuments = documents.filter(d => d.id !== id);
    
    setDocuments(newDocuments);
    setFilteredDocuments(getAccessibleDocuments(newDocuments, user));
    
    toast({
      title: "Document deleted",
      description: `${currentDoc.title} has been deleted.`,
    });
  };

  // Get a specific document
  const getDocument = (id: string): Document | undefined => {
    return documents.find(d => d.id === id);
  };

  // Add a new version to an existing document
  const addDocumentVersion = (docId: string, version: Partial<DocumentVersion>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add document versions",
        variant: "destructive",
      });
      return;
    }
    
    const docIndex = documents.findIndex(d => d.id === docId);
    
    if (docIndex === -1) {
      toast({
        title: "Document not found",
        description: "The document you are trying to update does not exist",
        variant: "destructive",
      });
      return;
    }
    
    const currentDoc = documents[docIndex];
    
    // Check if user has permission to update
    const canUpdate = user.role === 'admin' || 
                     currentDoc.createdBy === user.id || 
                     (user.role === 'department_head' && currentDoc.department === user.department);
    
    if (!canUpdate) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to update this document",
        variant: "destructive",
      });
      return;
    }
    
    const lastVersion = currentDoc.versions.length > 0 
      ? Math.max(...currentDoc.versions.map(v => v.version))
      : 0;
    
    const newVersion: DocumentVersion = {
      id: uuidv4(),
      version: lastVersion + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
      changeDescription: version.changeDescription || `Version ${lastVersion + 1}`,
      fileUrl: version.fileUrl || currentDoc.fileUrl,
    };
    
    const updatedDoc = {
      ...currentDoc,
      versions: [...currentDoc.versions, newVersion],
      updatedAt: new Date().toISOString(),
      fileUrl: version.fileUrl || currentDoc.fileUrl,
    };
    
    const newDocuments = [...documents];
    newDocuments[docIndex] = updatedDoc;
    
    setDocuments(newDocuments);
    setFilteredDocuments(getAccessibleDocuments(newDocuments, user));
    
    toast({
      title: "Version added",
      description: `Version ${newVersion.version} of ${updatedDoc.title} has been added.`,
    });
  };

  // Add a new tag
  const addTag = (tag: Partial<DocumentTag>) => {
    if (!tag.name) {
      toast({
        title: "Tag name required",
        description: "Please provide a name for the tag",
        variant: "destructive",
      });
      return;
    }
    
    const newTag: DocumentTag = {
      id: uuidv4(),
      name: tag.name,
      color: tag.color || '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
    };
    
    setTags(prev => [...prev, newTag]);
    
    toast({
      title: "Tag added",
      description: `Tag "${newTag.name}" has been created.`,
    });
  };

  // Delete a tag
  const deleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
    
    // Remove this tag from all documents
    const updatedDocs = documents.map(doc => ({
      ...doc,
      tags: doc.tags.filter(tagId => tagId !== id)
    }));
    
    setDocuments(updatedDocs);
    setFilteredDocuments(getAccessibleDocuments(updatedDocs, user));
    
    toast({
      title: "Tag deleted",
      description: "The tag has been removed from all documents.",
    });
  };

  // Filter documents based on search criteria
  const filterDocuments = (options: {
    search?: string;
    type?: DocumentType[];
    department?: string[];
    tags?: string[];
    dateRange?: [Date | null, Date | null];
    status?: DocumentStatus[];
  }) => {
    if (!user) {
      setFilteredDocuments([]);
      return;
    }
    
    let filtered = getAccessibleDocuments(documents, user);
    
    // Search in title and description
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchLower) || 
        doc.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by document type
    if (options.type && options.type.length > 0) {
      filtered = filtered.filter(doc => options.type?.includes(doc.type));
    }
    
    // Filter by department
    if (options.department && options.department.length > 0) {
      filtered = filtered.filter(doc => options.department?.includes(doc.department));
    }
    
    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(doc => 
        options.tags?.some(tagId => doc.tags.includes(tagId))
      );
    }
    
    // Filter by date range
    if (options.dateRange && options.dateRange[0] && options.dateRange[1]) {
      const startDate = options.dateRange[0];
      const endDate = options.dateRange[1];
      
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.createdAt);
        return docDate >= startDate && docDate <= endDate;
      });
    }
    
    // Filter by status
    if (options.status && options.status.length > 0) {
      filtered = filtered.filter(doc => options.status?.includes(doc.status));
    }
    
    setFilteredDocuments(filtered);
  };

  // Toggle favorite status
  const toggleFavorite = (id: string) => {
    if (!user) return;
    
    const docIndex = documents.findIndex(d => d.id === id);
    
    if (docIndex === -1) return;
    
    const newDocuments = [...documents];
    newDocuments[docIndex] = {
      ...newDocuments[docIndex],
      isFavorite: !newDocuments[docIndex].isFavorite
    };
    
    setDocuments(newDocuments);
    setFilteredDocuments(getAccessibleDocuments(newDocuments, user));
    
    toast({
      title: newDocuments[docIndex].isFavorite ? "Added to favorites" : "Removed from favorites",
      description: `${newDocuments[docIndex].title} has been ${newDocuments[docIndex].isFavorite ? 'added to' : 'removed from'} your favorites.`,
    });
  };

  // Download a document (mock function)
  const downloadDocument = (id: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to download documents",
        variant: "destructive",
      });
      return;
    }
    
    const doc = documents.find(d => d.id === id);
    
    if (!doc) {
      toast({
        title: "Document not found",
        description: "The document you are trying to download does not exist",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasDocumentAccess(doc, user)) {
      toast({
        title: "Access denied",
        description: "You don't have permission to download this document",
        variant: "destructive",
      });
      return;
    }
    
    // In a real application, this would initiate a download
    toast({
      title: "Download started",
      description: `${doc.title} is being downloaded.`,
    });
  };

  // Share a document with additional users
  const shareDocument = (id: string, users: string[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to share documents",
        variant: "destructive",
      });
      return;
    }
    
    const docIndex = documents.findIndex(d => d.id === id);
    
    if (docIndex === -1) {
      toast({
        title: "Document not found",
        description: "The document you are trying to share does not exist",
        variant: "destructive",
      });
      return;
    }
    
    const currentDoc = documents[docIndex];
    
    // Check if user has permission to share
    const canShare = user.role === 'admin' || 
                    currentDoc.createdBy === user.id || 
                    (user.role === 'department_head' && currentDoc.department === user.department);
    
    if (!canShare) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to share this document",
        variant: "destructive",
      });
      return;
    }
    
    // Update authorized users
    const updatedDoc = {
      ...currentDoc,
      accessLevel: 'custom' as DocumentAccess, // Cast to DocumentAccess
      authorizedUsers: [
        ...(currentDoc.authorizedUsers || []),
        ...users.filter(u => !(currentDoc.authorizedUsers || []).includes(u))
      ]
    };
    
    const newDocuments = [...documents];
    newDocuments[docIndex] = updatedDoc;
    
    setDocuments(newDocuments);
    setFilteredDocuments(getAccessibleDocuments(newDocuments, user));
    
    toast({
      title: "Document shared",
      description: `${updatedDoc.title} has been shared with ${users.length} user(s).`,
    });
  };

  useEffect(() => {
    // Update filtered documents when user changes
    if (user) {
      setFilteredDocuments(getAccessibleDocuments(documents, user));
    } else {
      setFilteredDocuments([]);
    }
  }, [user, documents]);

  const contextValue: DocumentContextType = {
    documents,
    filteredDocuments,
    tags,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    addDocumentVersion,
    addTag,
    deleteTag,
    filterDocuments,
    toggleFavorite,
    downloadDocument,
    shareDocument,
  };

  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}; 
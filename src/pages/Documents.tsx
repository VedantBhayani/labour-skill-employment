import React, { useState } from "react";
import { useDocuments } from "@/components/DocumentProvider";
import { useAuth } from "@/components/AuthProvider";
import {
  FileText,
  File,
  FileSpreadsheet,
  Image,
  Download,
  Search,
  Upload,
  Star,
  Filter,
  Plus,
  MoreHorizontal,
  Trash2,
  FileSignature,
  CheckCircle
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { DocumentSignatureModal } from "@/components/document-signature-modal";

// Format file size into human-readable format
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
};

// Get icon for document type
const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'pdf':
      return <File className="text-red-500" />;
    case 'xls':
      return <FileSpreadsheet className="text-green-500" />;
    case 'doc':
    case 'txt':
    case 'ppt':
      return <FileText className="text-blue-500" />;
    case 'image':
      return <Image className="text-purple-500" />;
    default:
      return <FileText className="text-gray-500" />;
  }
};

const Documents = () => {
  const { user } = useAuth();
  const { documents, tags, downloadDocument, toggleFavorite, deleteDocument } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy');
    } catch (e) {
      return dateStr;
    }
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const openSignatureModal = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsSignatureModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast({ title: "Filter clicked" })}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No documents found</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents
            .filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.type)}
                      <div>
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                        <CardDescription className="text-xs truncate max-w-[180px]">
                          {doc.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(doc.id)}
                        className="h-8 w-8"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            doc.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                          }`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => downloadDocument(doc.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSignatureModal(doc.id)}>
                            <FileSignature className="h-4 w-4 mr-2" />
                            {doc.signatures && doc.signatures.length > 0 
                              ? "View Signatures" 
                              : "Sign Document"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteDocument(doc.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {doc.tags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Badge 
                          key={tagId}
                          variant="secondary"
                          style={{ backgroundColor: tag.color, color: 'white' }}
                        >
                          {tag.name}
                        </Badge>
                      );
                    })}
                    {doc.needsSignature && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <FileSignature className="h-3 w-3 mr-1" /> Needs Signature
                      </Badge>
                    )}
                    {doc.signatures && doc.signatures.length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> 
                        {doc.signatures.length} {doc.signatures.length === 1 ? 'Signature' : 'Signatures'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between mb-1">
                      <span>Department:</span>
                      <span className="font-medium">{doc.department}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Size:</span>
                      <span className="font-medium">{formatFileSize(doc.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span className="font-medium">{formatDate(doc.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-2 bg-muted/20 flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8"
                    onClick={() => downloadDocument(doc.id)}
                  >
                    <Download className="h-3 w-3 mr-1" /> Download
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8"
                    onClick={() => openSignatureModal(doc.id)}
                  >
                    <FileSignature className="h-3 w-3 mr-1" /> 
                    {doc.signatures && doc.signatures.length > 0 ? "Signatures" : "Sign"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
        </div>
      )}

      {selectedDocumentId && (
        <DocumentSignatureModal
          documentId={selectedDocumentId}
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Documents;

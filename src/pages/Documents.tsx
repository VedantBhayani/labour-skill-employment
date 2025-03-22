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
  Trash2
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
  const { filteredDocuments, tags, downloadDocument, toggleFavorite, deleteDocument } = useDocuments();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
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
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Document Management</h1>
          <p className="text-muted-foreground">
            Secure document storage and sharing for your organization
          </p>
        </div>
        
        <Button 
          onClick={() => {
            toast({
              title: "Feature coming soon",
              description: "Document upload feature is under development.",
            });
          }}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first document to get started
          </p>
          <Button 
            onClick={() => {
              toast({
                title: "Feature coming soon",
                description: "Document upload feature is under development.",
              });
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex items-start gap-2">
                    {getDocumentIcon(doc.type)}
                    <div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{doc.description}</CardDescription>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadDocument(doc.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleFavorite(doc.id)}>
                        <Star className={`mr-2 h-4 w-4 ${doc.isFavorite ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                        {doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Documents;

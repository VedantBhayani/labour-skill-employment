"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SignaturePad } from "@/components/ui/signature-pad"
import { useDocuments } from "@/components/DocumentProvider"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, Clock, FileSignature, User } from "lucide-react"

interface DocumentSignatureModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export function DocumentSignatureModal({
  documentId,
  isOpen,
  onClose,
}: DocumentSignatureModalProps) {
  const { 
    getDocumentById, 
    signDocument, 
    getSignatureRequests,
    verifySignature 
  } = useDocuments()
  
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("sign")
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  
  const document = getDocumentById(documentId)
  const signatureRequests = document ? getSignatureRequests(documentId) : []
  
  if (!document) {
    return null
  }

  const handleSignatureCapture = async (signatureData: string, type: 'drawn' | 'typed' | 'certificate') => {
    try {
      await signDocument(documentId, signatureData, type)
      setShowSignaturePad(false)
      toast({
        title: "Document signed successfully",
        description: "Your signature has been added to the document.",
        variant: "default"
      })
    } catch (error) {
      toast({
        title: "Error signing document",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    }
  }

  const handleVerifySignature = async (signatureId: string) => {
    try {
      const verified = await verifySignature(documentId, signatureId)
      toast({
        title: verified ? "Signature verified" : "Signature verification failed",
        description: verified 
          ? "The signature is valid and has not been tampered with." 
          : "The signature could not be verified. It may have been tampered with.",
        variant: verified ? "default" : "destructive"
      })
    } catch (error) {
      toast({
        title: "Error verifying signature",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Document Signatures - {document.title}</DialogTitle>
        </DialogHeader>

        {showSignaturePad ? (
          <SignaturePad
            onSignatureCapture={handleSignatureCapture}
            onCancel={() => setShowSignaturePad(false)}
          />
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sign">Sign Document</TabsTrigger>
              <TabsTrigger value="signatures">
                Signatures ({document.signatures?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sign" className="space-y-4 py-4">
              {document.needsSignature ? (
                <>
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <FileSignature className="h-4 w-4" />
                      This document requires your signature
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      By signing this document, you acknowledge that your digital signature
                      will be legally binding and equivalent to a handwritten signature.
                    </p>
                  </div>

                  <div className="flex gap-4 flex-col">
                    <h4 className="text-sm font-medium">Signature Requests:</h4>
                    {signatureRequests.length > 0 ? (
                      <div className="space-y-2">
                        {signatureRequests.map((request) => (
                          <div key={request.id} className="flex items-center justify-between border rounded-md p-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{request.requestedFromName}</span>
                              <Badge variant={request.status === 'pending' ? 'outline' : 'secondary'}>
                                {request.status === 'pending' ? (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Pending
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Signed
                                  </span>
                                )}
                              </Badge>
                            </div>
                            {request.status === 'pending' && request.isCurrentUser && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowSignaturePad(true)}
                              >
                                Sign Now
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No signature requests found for this document.</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setShowSignaturePad(true)}>
                      Sign Document
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-md bg-muted p-4 text-center">
                  <p className="text-muted-foreground">
                    This document does not require signatures.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signatures" className="py-4">
              {document.signatures && document.signatures.length > 0 ? (
                <div className="space-y-4">
                  {document.signatures.map((signature) => (
                    <div key={signature.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{signature.userName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Signed on {new Date(signature.signedAt).toLocaleString()}
                          </p>
                          <Badge 
                            variant={signature.verified ? "success" : "outline"}
                            className="mt-1"
                          >
                            {signature.verified ? "Verified" : "Unverified"}
                          </Badge>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerifySignature(signature.id)}
                        >
                          Verify
                        </Button>
                      </div>
                      <div className="mt-2 p-2 bg-background rounded border">
                        <img 
                          src={signature.signatureData} 
                          alt={`${signature.userName}'s signature`} 
                          className="max-h-16 mx-auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No signatures have been added to this document yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
} 
"use client"

import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eraser, Save, Trash2, Type } from "lucide-react"

interface SignaturePadProps {
  onSignatureCapture: (signatureData: string, type: 'drawn' | 'typed' | 'certificate') => void
  onCancel: () => void
}

export function SignaturePad({ onSignatureCapture, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [selectedFont, setSelectedFont] = useState("cursive")
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn')

  // Initialize canvas when component mounts
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [])

  // Clear the canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const rect = canvas.getBoundingClientRect()
        let x, y
        
        if ('touches' in e) {
          // Touch event
          x = e.touches[0].clientX - rect.left
          y = e.touches[0].clientY - rect.top
        } else {
          // Mouse event
          x = e.clientX - rect.left
          y = e.clientY - rect.top
        }
        
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const rect = canvas.getBoundingClientRect()
        let x, y
        
        if ('touches' in e) {
          // Touch event
          x = e.touches[0].clientX - rect.left
          y = e.touches[0].clientY - rect.top
        } else {
          // Mouse event
          x = e.clientX - rect.left
          y = e.clientY - rect.top
        }
        
        ctx.lineTo(x, y)
        ctx.stroke()
      }
    }
  }

  const endDrawing = () => {
    setIsDrawing(false)
  }

  // Capture the drawn signature
  const captureDrawnSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png')
      onSignatureCapture(signatureData, 'drawn')
    }
  }

  // Capture the typed signature
  const captureTypedSignature = () => {
    if (!typedName.trim()) return
    
    // Create a canvas to render the typed signature
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      canvas.width = 400
      canvas.height = 150
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `32px ${selectedFont}`
      ctx.fillStyle = 'black'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)
      
      const signatureData = canvas.toDataURL('image/png')
      onSignatureCapture(signatureData, 'typed')
    }
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-background">
      <h3 className="text-lg font-semibold mb-4">Capture Your Signature</h3>
      
      <Tabs defaultValue="drawn" onValueChange={(value) => setSignatureType(value as 'drawn' | 'typed')}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="drawn">Draw Signature</TabsTrigger>
          <TabsTrigger value="typed">Type Signature</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drawn">
          <div className="border rounded-md p-1 mb-4">
            <canvas 
              ref={canvasRef}
              width={400}
              height={150}
              className="w-full h-[150px] border border-dashed border-gray-300 bg-white touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            ></canvas>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearCanvas}
              className="flex items-center gap-2"
            >
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={captureDrawnSignature}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Signature
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="typed">
          <div className="space-y-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="signature-name">Your Full Name</Label>
              <Input 
                id="signature-name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name as you would sign it"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signature-font">Signature Style</Label>
              <Select value={selectedFont} onValueChange={setSelectedFont}>
                <SelectTrigger id="signature-font">
                  <SelectValue placeholder="Select a font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cursive">Handwritten</SelectItem>
                  <SelectItem value="serif">Formal</SelectItem>
                  <SelectItem value="monospace">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="p-4 border rounded-md bg-white min-h-[80px] flex items-center justify-center">
              {typedName ? (
                <p className={`text-2xl font-${selectedFont}`}>{typedName}</p>
              ) : (
                <p className="text-muted-foreground text-center">Your signature will appear here</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={captureTypedSignature}
              disabled={!typedName.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Signature
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createAnalysis } from "@/lib/analysis-api";
import { CloudUpload } from "lucide-react";

const uploadFormSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  text: z.string().min(10, "Text must be at least 10 characters"),
  removeStopwords: z.boolean().default(true),
  lemmatization: z.boolean().default(true),
  removeAccents: z.boolean().default(false),
  communityDetection: z.boolean().default(true),
  minFrequency: z.number().min(1, "Must be at least 1").default(2),
  maxWords: z.number().min(10, "Must be at least 10").default(100),
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

interface FileUploadProps {
  onAnalysisComplete: (analysisId: string) => void;
}

export default function FileUpload({ onAnalysisComplete }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      fileName: "",
      text: "",
      removeStopwords: true,
      lemmatization: true,
      removeAccents: false,
      communityDetection: true,
      minFrequency: 2,
      maxWords: 100,
    },
  });

  const createAnalysisMutation = useMutation({
    mutationFn: createAnalysis,
    onSuccess: (analysis) => {
      toast({
        title: "Analysis Created",
        description: "Your text analysis has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      onAnalysisComplete(analysis.id);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create analysis",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UploadFormData) => {
    createAnalysisMutation.mutate({
      fileName: data.fileName,
      originalText: data.text,
      options: {
        removeStopwords: data.removeStopwords,
        lemmatization: data.lemmatization,
        removeAccents: data.removeAccents,
        communityDetection: data.communityDetection,
        minFrequency: data.minFrequency,
        maxWords: data.maxWords,
      },
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("fileName", file.name);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        form.setValue("text", content);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("text/")) {
      form.setValue("fileName", file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        form.setValue("text", content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a text file",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Upload Text for Analysis</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* File Upload Area */}
              <div className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragOver 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="file-drop-zone"
                >
                  <CloudUpload className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-medium mb-2">Drop your files here</h3>
                  <p className="text-muted-foreground mb-4">Supports TXT files</p>
                  <Input
                    type="file"
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    data-testid="input-file"
                  />
                  <Button 
                    type="button" 
                    onClick={() => document.getElementById("file-input")?.click()}
                    data-testid="button-choose-files"
                  >
                    Choose Files
                  </Button>
                </div>
                
                <div className="text-center">
                  <span className="text-muted-foreground">or</span>
                </div>
                
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="fileName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter file name..."
                            {...field}
                            data-testid="input-filename"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            className="min-h-32 resize-none"
                            placeholder="Paste your text directly here..."
                            {...field}
                            data-testid="input-text"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Analysis Options */}
              <div className="space-y-4">
                <h3 className="font-medium text-foreground">Analysis Options</h3>
                
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="removeStopwords"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-stopwords"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>Remove stopwords</Label>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lemmatization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-lemmatization"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>Lemmatization</Label>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="removeAccents"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-accents"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>Remove accents</Label>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="communityDetection"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-communities"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>Community detection</Label>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="minFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min frequency</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-min-frequency"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxWords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max words</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-max-words"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={createAnalysisMutation.isPending}
                  data-testid="button-start-analysis"
                >
                  {createAnalysisMutation.isPending ? "Starting..." : "Start Analysis"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

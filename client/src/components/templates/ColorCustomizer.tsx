import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, RotateCcw } from "lucide-react";

interface ColorVariable {
  name: string;
  label: string;
  defaultValue: string;
  currentValue: string;
}

interface ColorCustomizerProps {
  templateId: number;
  colorVariables: ColorVariable[];
  onColorsChange: (colors: Record<string, string>) => void;
  onReset: () => void;
}

export default function ColorCustomizer({ 
  templateId, 
  colorVariables, 
  onColorsChange, 
  onReset 
}: ColorCustomizerProps) {
  const [colors, setColors] = useState<Record<string, string>>(
    colorVariables.reduce((acc, variable) => {
      acc[variable.name] = variable.currentValue;
      return acc;
    }, {} as Record<string, string>)
  );

  const handleColorChange = (variableName: string, value: string) => {
    const newColors = { ...colors, [variableName]: value };
    setColors(newColors);
    onColorsChange(newColors);
  };

  const handleReset = () => {
    const defaultColors = colorVariables.reduce((acc, variable) => {
      acc[variable.name] = variable.defaultValue;
      return acc;
    }, {} as Record<string, string>);
    setColors(defaultColors);
    onColorsChange(defaultColors);
    onReset();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Personalizza Colori</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
        <CardDescription>
          Personalizza la palette colori del template per il tuo ristorante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {colorVariables.map((variable) => (
            <div key={variable.name} className="space-y-2">
              <Label htmlFor={variable.name} className="text-sm font-medium">
                {variable.label}
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={variable.name}
                  type="color"
                  value={colors[variable.name]}
                  onChange={(e) => handleColorChange(variable.name, e.target.value)}
                  className="w-16 h-10 p-1 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors[variable.name]}
                  onChange={(e) => handleColorChange(variable.name, e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Anteprima Colori</h4>
          <div className="flex flex-wrap gap-2">
            {colorVariables.map((variable) => (
              <div key={variable.name} className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: colors[variable.name] }}
                />
                <span className="text-xs text-muted-foreground">
                  {variable.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
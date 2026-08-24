"use client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useFormSubmit } from "@/hooks/useFormSubmit"
import { IChangeEvent, withTheme } from "@rjsf/core"
import { Theme as shadcnTheme } from "@rjsf/shadcn"
import { RJSFSchema, WidgetProps } from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"
import { useState } from "react"
import * as z from "zod"

const Form = withTheme(shadcnTheme)

const widgets = {
  CheckboxWidget: ({ value, onChange, label }: WidgetProps) => (
    <label className="flex items-center gap-2">
      <span>{label}</span>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </label>
  ),
}

type MutationResult = { success: boolean; error?: string | null }

type TodoFormProps<S extends z.ZodObject<z.ZodRawShape>> = {
  schema: S
  action: (data: z.infer<S>) => Promise<MutationResult>
  successMessage: string
  initialData?: Record<string, unknown>
  onCancel: () => void
  onSuccess: () => void
}

export default function TodoForm<S extends z.ZodObject<z.ZodRawShape>>({
  schema,
  action,
  successMessage,
  initialData,
  onCancel,
  onSuccess,
}: TodoFormProps<S>) {
  const [data, setData] = useState<Record<string, unknown>>(initialData ?? {})

  const { submit, isPending, error } = useFormSubmit({
    schema,
    action,
    successMessage,
    onSuccess,
  })

  const jsonSchema = z.toJSONSchema(schema) as RJSFSchema
  jsonSchema.$schema = "http://json-schema.org/draft-07/schema#"

  const uiSchema = Object.keys(schema.shape).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        "ui:options": {
          classNames: "capitalize",
        },
      },
    }),
    {}
  )

  return (
    <div className="flex flex-col gap-2">
      <Form
        schema={jsonSchema}
        formData={data}
        uiSchema={uiSchema}
        validator={validator}
        onChange={(e) => setData(e.formData)}
        onSubmit={({ formData }: IChangeEvent) => submit(formData)}
        widgets={widgets}
        className="flex flex-col gap-2"
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            Save
          </Button>
        </div>
      </Form>
      {error && (
        <div className="mt-4 rounded bg-red-100 p-4 text-red-700">
          <strong className="font-bold">Error:</strong>
          <span className="block">{error}</span>
        </div>
      )}
    </div>
  )
}

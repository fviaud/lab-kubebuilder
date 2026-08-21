"use client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useFormSubmit } from "@/hooks/useFormSubmit"
import { createTodo } from "@/lib/actionsTodo"
import { TodoCreateSchema } from "@/models/todo.model"
import { IChangeEvent, withTheme } from "@rjsf/core"
import { Theme as shadcnTheme } from "@rjsf/shadcn"
import { RJSFSchema, WidgetProps } from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"
import { useRouter } from "next/navigation"
import * as z from "zod"

const pathRoot = "/todos"
const Form = withTheme(shadcnTheme)

const widgets = {
  CheckboxWidget: ({ value, onChange, label }: WidgetProps) => (
    <label className="flex items-center gap-2">
      <span>{label}</span>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </label>
  ),
}

export default function Page() {
  const router = useRouter()

  const { submit, isPending, error } = useFormSubmit({
    schema: TodoCreateSchema,
    action: createTodo,
    successMessage: "Todo created successfully!",
    onSuccess: () => router.push(pathRoot),
  })

  const jsonSchema = z.toJSONSchema(TodoCreateSchema) as RJSFSchema
  jsonSchema.$schema = "http://json-schema.org/draft-07/schema#"

  const uiSchema = Object.keys(TodoCreateSchema.shape).reduce(
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
        uiSchema={uiSchema}
        validator={validator}
        onSubmit={({ formData }: IChangeEvent) => submit(formData)}
        widgets={widgets}
        className="flex flex-col gap-2"
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(pathRoot)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            Save
          </Button>
        </div>
      </Form>
      <div>
        {error && (
          <div className="mt-4 rounded bg-red-100 p-4 text-red-700">
            <strong className="font-bold">Error:</strong>
            <span className="block">{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}

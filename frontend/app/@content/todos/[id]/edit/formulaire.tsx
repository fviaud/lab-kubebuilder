"use client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useFormSubmit } from "@/hooks/useFormSubmit"
import { updateTodo } from "@/lib/actionsTodo"
import { TodoSchema, TodoUpdateSchema } from "@/models/todo.model"
import { IChangeEvent, withTheme } from "@rjsf/core"
import { Theme as shadcnTheme } from "@rjsf/shadcn"
import { RJSFSchema } from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"
import { useRouter } from "next/navigation"
import { useState } from "react"
import * as z from "zod"
const pathRoot = "/todos"

const Form = withTheme(shadcnTheme)

const widgets = {
  CheckboxWidget: ({ value, onChange, label }: any) => (
    <label className="flex items-center gap-2">
      <span>{label}</span>
      <Switch checked={!!value} onCheckedChange={onChange} />
    </label>
  ),
}

function pick<T, K extends readonly (keyof T)[]>(
  obj: T,
  keys: K
): Pick<T, K[number]> {
  return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<
    T,
    K[number]
  >
}

export default function Page({ item }: { item: z.infer<typeof TodoSchema> }) {
  const itemData = item.id
    ? pick(item, Object.keys(TodoUpdateSchema.shape) as (keyof typeof item)[])
    : {}

  const [data, setData] = useState(itemData || {})
  const router = useRouter()

  const { submit, isPending, error } = useFormSubmit({
    schema: TodoUpdateSchema,
    action: (formData) =>
      updateTodo({
        ...formData,
        ...(item.id ? { id: item.id } : {}),
      }),
    successMessage: "Updated successfully!",
    onSuccess: () => router.back(),
  })

  const jsonSchema = z.toJSONSchema(TodoUpdateSchema) as RJSFSchema
  jsonSchema.$schema = "http://json-schema.org/draft-07/schema#"

  const uiSchema = Object.keys(TodoUpdateSchema.shape).reduce(
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
    <div>
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
          <Button type="button" variant="outline" onClick={() => router.back()}>
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

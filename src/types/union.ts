/**
 * Union is a utility type to turn concrete instances of {} and [] into union types
 *
 * There are two main use cases:
 * 1. union types from concrete instances - we often want both the types and the values
 * 2. typesafe replacement for enums
 *
 * @example
 * // Typesafe Enums
 * ```
 * // enum, first define the map (using `as const`)
 * export const Colors = {
 *  RED: 'red',
 *  BLUE: 'blue',
 * } as const
 *
 * // then use the same name, but define a type using Union
 * export type Colors = Union<typeof Colors>
 * ```
 * And they are used like this
 * ```
 * // now they can be used like "enum":
 * Colors.RED // 'red'
 *
 * // and as types
 * function paint(color: Color): void
 *
 * // and as values
 * Object.values(Colors).map(paint)
 * ```
 *
 * @example
 * Here we will turn a readonly array into union types
 * ```
 * // Union types derived from values
 * export const Sounds = ['bark', 'meow'] as const
 * export type Sounds = Union<typeof Sounds>
 * ```
 * And they are used like this
 * ```
 * // used as a union type
 * function speak(sound: Sounds): void
 *
 * // and used as values
 * Sounds.map(speak)
 * ```
 */
 export type Union<T> = T extends { readonly [Key in keyof T]: infer Item }
 ? Item
 : T extends ReadonlyArray<infer Item>
 ? Item
 : never

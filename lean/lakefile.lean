import Lake
open Lake DSL

package «neural-nestor-gauge-logic» where
  version := v!"0.1.0"

lean_lib «NeuralNestorGaugeLogic» where
  -- add library configuration options here

@[default_target]
lean_exe «neural-nestor-gauge-logic» where
  root := `Main

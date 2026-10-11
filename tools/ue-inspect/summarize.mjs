import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

for (const directory of process.argv.slice(2)) {
  for (const file of (await readdir(directory)).filter(f => f.endsWith('.json') && f !== 'manifest.json')) {
    const asset = JSON.parse(await readFile(join(directory, file), 'utf8'));
    const ref = i => {
      const o = i > 0 ? asset.Exports[i - 1] : asset.Imports[-i - 1];
      return o?.ObjectName ?? String(i);
    };
    const type = x => x?.$type?.split('.').at(-1)?.split(',')[0];
    const value = x => {
      if (x === null || typeof x !== 'object') return x;
      if (Array.isArray(x)) return x.map(value);
      if ('Value' in x) {
        const v = type(x) === 'ObjectPropertyData' ? ref(x.Value) : value(x.Value);
        return x.Name ? { [x.Name]: v } : v;
      }
      return Object.fromEntries(Object.entries(x).filter(([k]) => !['$type', 'ArrayIndex', 'PropertyGuid', 'StructGUID', 'SerializeNone', 'SerializationControl', 'Operation', 'PropertyTagFlags', 'PropertyTagExtensions', 'IsZero', 'PropertyTypeName'].includes(k)).map(([k,v]) => [k,value(v)]));
    };
    const expr = x => {
      if (x === null || typeof x !== 'object') return JSON.stringify(x);
      if (Array.isArray(x)) return x.map(expr).join(', ');
      const t = type(x);
      if (t?.includes('Variable')) return x.Variable?.New?.Path?.join('.') ?? JSON.stringify(x.Variable);
      if (t?.includes('Function') || t === 'EX_CallMath') return `${x.VirtualFunctionName ?? ref(x.StackNode)}(${expr(x.Parameters ?? [])})`;
      if (t === 'EX_Context' || t === 'EX_Context_FailSilent') return `${expr(x.ObjectExpression)}.${expr(x.ContextExpression)}`;
      if (t?.startsWith('EX_Let')) return `${expr(x.Variable ?? x.VariableExpression)} = ${expr(x.Expression ?? x.AssignmentExpression)}`;
      if (t === 'EX_ObjectConst') return ref(x.Value);
      if (t === 'EX_Self') return 'self';
      if (t === 'EX_StructConst') return `${ref(x.Struct)}(${expr(x.Value)})`;
      if (t === 'EX_DynamicCast') return `cast<${ref(x.ClassPtr)}>(${expr(x.Target)})`;
      if (t === 'EX_JumpIfNot') return `if NOT (${expr(x.BooleanExpression)}) jump ${x.CodeOffset}`;
      if (t === 'EX_Jump') return `jump ${x.CodeOffset}`;
      if (t === 'EX_Return') return `return ${expr(x.ReturnExpression)}`;
      if (t?.endsWith('Const')) return JSON.stringify(x.Value);
      if (t === 'EX_True') return 'true';
      if (t === 'EX_False') return 'false';
      if (t === 'EX_Nothing') return '';
      return `${t ?? ''}${JSON.stringify(value(x))}`;
    };
    const lines = [`ASSET ${asset.FolderName}`, `ENGINE ${JSON.stringify(value(asset.RecordedEngineVersion))}`];
    for (const c of asset.Exports.filter(e => type(e) === 'ClassExport')) {
      lines.push(`CLASS ${c.ObjectName}`, ...c.LoadedProperties.map(p => `  ${p.Name}: ${p.SerializedType} [${p.PropertyFlags}]`));
    }
    for (const c of asset.Exports.filter(e => e.ObjectName.startsWith('Default__') || e.ObjectName.endsWith('_GEN_VARIABLE'))) {
      lines.push(`DEFAULT ${c.ObjectName}`, JSON.stringify(value(c.Data),null,2));
    }
    for (const f of asset.Exports.filter(e => type(e) === 'FunctionExport')) {
      lines.push(`FUNCTION ${f.ObjectName} [${f.FunctionFlags}]`, ...(f.ScriptBytecode ?? []).filter(e => !/Tracepoint|EndOfScript/.test(type(e))).map(e => `  ${expr(e)}`));
    }
    await writeFile(join(directory, file.replace('.json','.txt')), lines.join('\n'));
    console.log(`${file}: ${asset.Exports.filter(e => type(e) === 'FunctionExport').length} functions`);
  }
}

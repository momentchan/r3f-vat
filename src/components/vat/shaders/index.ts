export const VAT_VERTEX_SHADER = /* glsl */`
uniform sampler2D uPosTex;
uniform sampler2D uNrmTex;
uniform float uFrame;
uniform float uFrames;
uniform float uTexW;
uniform int uStoreDelta;
uniform int uNormalsCompressed;

attribute vec4 color;

varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vColor;

vec3 octDecode(vec2 e) {
  e = e * 2.0 - 1.0;
  vec3 v = vec3(e.x, e.y, 1.0 - abs(e.x) - abs(e.y));
  if (v.z < 0.0) v.xy = (1.0 - abs(v.yx)) * sign(v.xy);
  return normalize(v);
}

vec3 VAT_pos_f(float f) {
  float fx = (f + 0.5) / uTexW;
  vec2 uv = vec2(uv2.x + fx, uv2.y);
  return texture2D(uPosTex, uv).xyz;
}

vec3 VAT_pos(float f) {
  float f0 = floor(f);
  float f1 = min(f0 + 1.0, uFrames - 1.0);
  vec3 p0 = VAT_pos_f(f0);
  vec3 p1 = VAT_pos_f(f1);
  return mix(p0, p1, fract(f));
}

vec3 VAT_nrm_f(float f) {
  float fx = (f + 0.5) / uTexW;
  vec2 uv = vec2(uv2.x + fx, uv2.y);
  vec4 texel = texture2D(uNrmTex, uv);
  if (uNormalsCompressed == 1) {
    return octDecode(texel.xy);
  } else {
    return normalize(texel.xyz);
  }
}

vec3 VAT_nrm(float f) {
  float f0 = floor(f);
  float f1 = min(f0 + 1.0, uFrames - 1.0);
  vec3 n0 = VAT_nrm_f(f0);
  vec3 n1 = VAT_nrm_f(f1);
  return normalize(mix(n0, n1, fract(f)));
}

void main() {
  vec3 vatPos = VAT_pos(uFrame);
  vec3 basePos = position;

  vec3 position = (uStoreDelta == 1) ? (basePos + vatPos) : vatPos;

  csm_Position = position;
  csm_Normal = VAT_nrm(uFrame);
  vUv = uv;
  vUv2 = uv2;
  vColor = color.rgb;
}
`

export const VAT_FRAGMENT_SHADER = /* glsl */`
void main() {
  // Material handles all color/rendering
}
`

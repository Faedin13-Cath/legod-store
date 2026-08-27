import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "Jango's Store — Minifiguras LEGO"
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OG() {
  const [bold, ultra] = await Promise.all([
    fetch(new URL('../../public/fonts/ABCSolar-Bold-Trial.otf', import.meta.url)).then(r => r.arrayBuffer()),
    fetch(new URL('../../public/fonts/ABCSolar-Ultra-Trial.otf', import.meta.url)).then(r => r.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '60px 90px', position: 'relative',
          background: '#FFFFFF',
          color: '#1A1E5A', fontFamily: 'ABC Solar', overflow: 'hidden',
        }}
      >
        <svg
          width="560" height="606" viewBox="0 0 2581.7 2800"
          style={{ position: 'absolute', left: -100, bottom: -90 }}
          fill="#5526AD"
          opacity={0.12}
        >
          <path d="M29.19,2081.41c7.17,5.45,15.64,8.37,26.06,6.33,39.65-7.78,216.16-201.61,200.97-224.8L0,1827.43c63.27-86.45,181.09-152.6,287.67-152.94l-161.38-81.1c-69.55-8.77,59.31-76.89,79.24-86.68,90.68-44.62,204-69.26,303.35-46.14,22.36-63.98-206.84-153.94-203.41-167.14,13.05-22.89,51.68-33.75,75.48-43.76,93.55-39.43,202.64-72.45,304.52-59.33-9.86-65.48-75.11-110.12-74.42-177.65l351.11-11.26c24.03-9.59,29.25-60.92,55-80.05,73-54.16,238.53,25.62,320.29,18.02,49.52-4.6,183.81-54.89,232.1-78.26,155.82-75.43,229.7-224.36,432.65-138.2,113.57,48.21,76.54,174.74,61.78,270.28-2.44,15.9-33.08,83.83-20.19,102.65-22.71-26.72-48.85-72.25-92.89-77.23-17.55-2-239.19,204.93-267.06,230.43-8.86,8.09-2.83,1.68-23.3,25.49,34.9-11.35,242.84-33.39,256.11-46.74,10.96-11.06,9.24-46.66,16.38-63.37l221.98,136.76c7.99,8.21,6.73,11.34,4.15,21.1-5.99,22.84-78.82,210.98-87.39,219.1-13,12.32-39.87,6.47-51.51-5.9-17.73-18.84,8.17-85.49-21.24-80.05l-540.08,287.66c-81.3,5.19-167.82-13.04-227.66-71.85-79.95,264.91-376.25,373.67-423.52,645.46-22.14,127.29-4.83,284.02-19.67,414.88,0,0-30.52,381.53-472.12,736.73" />
          <path d="M2434.01,1045.45c-135.59,17.48-275.75-47.51-388.52,52.38,75.24-65.54,66.33-169.29,296.28-213.94,26.25-5.12,113.39-6.47,126.74-14.47,22.85-13.7,107.1-64.63,108.23-58.32,20.3,111.79-20.51,218.61-142.72,234.35Z" />
        </svg>

        <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 5, color: '#5526AD' }}>
          JANGO&#39;S STORE
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontSize: 74, fontWeight: 900, lineHeight: 1.05, marginTop: 16, maxWidth: 900, letterSpacing: -2, color: '#1A1E5A' }}>
          Minifiguras LEGO que no consigues en tienda
        </div>
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 500, marginTop: 28, color: '#5B5F8A' }}>
          Star Wars · Marvel · DC · Apartados · Envíos a todo México
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'ABC Solar', data: bold, weight: 700, style: 'normal' },
        { name: 'ABC Solar', data: ultra, weight: 900, style: 'normal' },
      ],
    },
  )
}

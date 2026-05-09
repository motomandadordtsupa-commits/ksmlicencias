import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { hwid, app_name, client_name } = await req.json()

    if (!hwid || !app_name) {
      return new Response(
        JSON.stringify({ error: 'hwid and app_name are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    )

    const { data, error } = await supabaseClient
      .from('ksm_licenses')
      .select('is_active, expires_at, client_name')
      .eq('hwid', hwid)
      .eq('app_name', app_name)
      .single()

    // SI NO EXISTE LA LICENCIA
    if (error) {
      if (client_name) {
        // Auto-registro
        const { error: insertError } = await supabaseClient
          .from('ksm_licenses')
          .insert([{ hwid, app_name, client_name, is_active: false }])
        
        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({ authorized: false, status: 'pending', message: 'Solicitud enviada exitosamente.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } else {
        // No está registrado y no envió nombre, pedir nombre
        return new Response(
          JSON.stringify({ authorized: false, status: 'not_registered', message: 'Dispositivo no registrado.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // SI EXISTE PERO ESTÁ DESACTIVADA O PENDIENTE
    if (!data.is_active) {
      return new Response(
        JSON.stringify({ authorized: false, status: 'blocked', message: 'Esperando autorización del administrador o acceso revocado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // SI EXISTE Y ESTÁ ACTIVA, REVISAR FECHA DE CADUCIDAD
    if (data.expires_at) {
      const expirationDate = new Date(data.expires_at)
      if (expirationDate.getTime() < new Date().getTime()) {
        const formattedDate = expirationDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        return new Response(
          JSON.stringify({ authorized: false, status: 'expired', message: `Tu licencia expiró el ${formattedDate}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // SI TODO ESTÁ PERFECTO
    return new Response(
      JSON.stringify({ authorized: true, status: 'active', message: 'Licencia Válida.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

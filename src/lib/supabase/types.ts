export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string
          name: string
          state: string
          image_url: string | null
          listing_count: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['cities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['cities']['Insert']>
      }
      agents: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          bio: string | null
          avatar_url: string | null
          city_id: string | null
          specialties: string[]
          listings_sold: number
          rating: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agents']['Insert']>
      }
      listings: {
        Row: {
          id: string
          title: string
          price: number
          address: string
          city_id: string
          agent_id: string
          bedrooms: number
          bathrooms: number
          sqft: number
          image_url: string | null
          description: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['listings']['Insert']>
      }
    }
  }
}

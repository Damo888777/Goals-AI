import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class VisionImage extends Model {
  static table = 'vision_images'

  @field('user_id') userId!: string
  @field('goal_id') goalId!: string | null
  @field('image_url') imageUrl!: string
  @field('image_type') imageType!: string | null // 'vision', 'generated', 'uploaded'
  @field('prompt') prompt!: string | null
  @field('file_size') fileSize!: number | null
  @field('mime_type') mimeType!: string | null
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

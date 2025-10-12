import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class VisionImage extends Model {
  static table = 'vision_images'

  @field('user_id') userId!: string
  @field('image_uri') imageUri!: string
  @field('aspect_ratio') aspectRatio!: number
  @field('source') source!: string // 'generated' or 'uploaded'
  
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}

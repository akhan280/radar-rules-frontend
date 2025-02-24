"use client"
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { updateUploadStatus } from '@/lib/actions/upload-actions';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

interface TrainModelButtonProps {
    csv_upload_id: string;
    projectId: string;
    autoStart?: boolean;
    onTrainingComplete?: () => void;
    onTrainingFailed?: () => void;
}

export function TrainModelButton({ 
    csv_upload_id, 
    projectId,
    autoStart = false, 
    onTrainingComplete,
    onTrainingFailed
}: TrainModelButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const updateCsvUpload = useStore(state => state.updateCsvUpload);

    useEffect(() => {
        if (autoStart) {
            handleTrainModel();
        }
    }, [autoStart]);

    const handleTrainModel = async () => {
        try {
            setIsLoading(true);
            // Update local state to PROCESSING
            updateCsvUpload(projectId, csv_upload_id, { status: 'PROCESSING' });

            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_URL}/api/train/${csv_upload_id}`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to start model training');
            }

            // Wait for training to complete
            const result = await response.json();
            
            // Update status to COMPLETED and add results
            await updateUploadStatus(csv_upload_id, 'COMPLETED');
            updateCsvUpload(projectId, csv_upload_id, { 
                status: 'COMPLETED',
                results: result.results || []
            });
            
            if (onTrainingComplete) {
                onTrainingComplete();
            }
        } catch (error) {
            console.error('Error training model:', error);
            // Update status to FAILED
            try {
                await updateUploadStatus(csv_upload_id, 'FAILED');
                updateCsvUpload(projectId, csv_upload_id, { status: 'FAILED' });
                if (onTrainingFailed) {
                    onTrainingFailed();
                }
                toast.error('Training failed. Please try again.');
            } catch (statusError) {
                console.error('Failed to update status:', statusError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleTrainModel}
            disabled={isLoading}
            variant="default"
            className="w-full"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training in progress...
                </>
            ) : (
                'Train ML Model'
            )}
        </Button>
    );
} 
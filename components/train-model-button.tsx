"use client"
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
import { updateUploadStatus } from '@/lib/actions/upload-actions';
import { toast } from 'sonner';
import { useMainStore } from '../lib/store';

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
    const { updateCsvUpload } = useMainStore();

    useEffect(() => {
        if (autoStart) {
            handleTrainModel();
        }
    }, [autoStart]);

    const handleTrainModel = async () => {
        try {
            setIsLoading(true);
            // Update local state to TRAINING
            updateCsvUpload(projectId, csv_upload_id, { status: 'TRAINING' });

            const response = await fetch(`${process.env.NEXT_PUBLIC_ML_URL}/api/train/${csv_upload_id}`, {
                method: 'POST',
            });

            // Wait for training to complete
            const result = await response.json();
            
            if (!result?.results) {
                throw new Error('Failed to start model training: No results returned');
            }
            
            // First update the database
            await updateUploadStatus(csv_upload_id, 'COMPLETED');

            // Then update the local state with both status and results
            const fraudAnalysisResult = {
                id: result.results.id,
                projectId: result.results.project_id,
                csvUploadId: result.results.csv_upload_id,
                fraudCount: result.results.fraud_count,
                f1OptimizedRules: result.results.f1_optimized_rules,
                precisionOptimizedRules: result.results.precision_optimized_rules,
                moneyOptimizedRules: result.results.money_optimized_rules,
                createdAt: new Date(result.results.created_at)
            };

            // Update the upload in the store
            updateCsvUpload(projectId, csv_upload_id, {
                status: 'COMPLETED',
                results: [fraudAnalysisResult]
            });
            
            toast.success('Training completed successfully');
            
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